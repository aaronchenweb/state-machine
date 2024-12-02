import { useEffect, useRef, useState } from "react";
import * as go from "gojs";
import { Modal } from "antd";

// Initial diagram model data
const initialModel = {
  class: "GraphLinksModel",
  pointsDigits: 0,
  nodeDataArray: [
    { key: -1, category: "Start", loc: "-237 41", text: "Start" },
    { key: -2, category: "End", loc: "277 696", text: "End" },
    {
      category: "Conditional",
      text: "Is data\ntree-like?",
      key: -14,
      loc: "40 165",
    },
    { category: "step", text: "Use a TreeModel", key: -5, loc: "-100 230" },
    {
      category: "step",
      text: "Use a GraphLinksModel",
      key: -6,
      loc: "180 230",
    },
    {
      category: "Comment",
      text: "GraphLinksModel\nalso allows Groups",
      key: -7,
      loc: "362 230",
    },
    {
      category: "step",
      text: "Create DIV for Diagram",
      key: -8,
      loc: "-64 41",
    },
    {
      category: "step",
      text: "Create new Diagram associated with DIV",
      key: -9,
      loc: "164 41",
    },
    { category: "step", text: "Style node templates", key: -10, loc: "40 617" },
    {
      category: "step",
      text: "Add data to node/linkDataArray",
      key: -12,
      loc: "180 320",
    },
    {
      category: "step",
      text: "Add data to nodeDataArray, including parent",
      key: -13,
      loc: "-100 320",
    },
    {
      category: "step",
      text: "Style link templates",
      key: -15,
      loc: "277 617",
    },
    {
      category: "Conditional",
      text: "Should nodes be auto-positioned?",
      key: -16,
      loc: "40 460",
    },
    { category: "step", text: "Choose a layout", key: -18, loc: "-100 525" },
    {
      category: "step",
      text: "Set location in node data and bind",
      key: -17,
      loc: "180 525",
    },
  ],
  linkDataArray: [
    { from: -1, to: -8 },
    { from: -8, to: -9 },
    { from: -5, to: -13 },
    { from: -6, to: -12 },
    { from: -15, to: -2 },
    { from: -14, to: -5, text: "Yes" },
    { from: -14, to: -6, text: "No" },
    { from: -9, to: -14 },
    { from: -13, to: -16 },
    { from: -12, to: -16 },
    { from: -16, to: -18, text: "Yes" },
    { from: -16, to: -17, text: "No" },
    { from: -18, to: -10 },
    { from: -17, to: -10 },
    { from: -10, to: -15 },
  ],
};

const FlowchartEditor = () => {
  const diagramRef = useRef(null);
  const paletteRef = useRef(null);
  const myDiagramRef = useRef(null);
  const myPaletteRef = useRef(null);
  const [modelText, setModelText] = useState(() => {
    // Format the initial model JSON nicely
    return JSON.stringify(initialModel, null, 2);
  });
  const [isModified, setIsModified] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  // Define custom figures for node templates
  const defineFigures = () => {
    go.Shape.defineFigureGenerator("Conditional", (shape, w, h) => {
      const geo = new go.Geometry();
      const fig = new go.PathFigure(w * 0.15, 0, true);
      geo.add(fig);
      fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.85, 0));
      fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
      fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.85, h));
      fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.15, h));
      fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h).close());
      geo.spot1 = new go.Spot(0.15, 0);
      geo.spot2 = new go.Spot(0.85, 1);
      return geo;
    });

    go.Shape.defineFigureGenerator("File", (shape, w, h) => {
      const geo = new go.Geometry();
      const fig = new go.PathFigure(0, 0, true);
      geo.add(fig);
      fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
      fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
      fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
      fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
      const fig2 = new go.PathFigure(0.75 * w, 0, false);
      geo.add(fig2);
      fig2.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.25 * h));
      fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
      geo.spot1 = new go.Spot(0, 0.25);
      geo.spot2 = go.Spot.BottomRight;
      return geo;
    });
  };

  // Helper functions for node templates
  const nodeStyle = (node) => {
    node
      .set({ locationSpot: go.Spot.Center })
      .bindTwoWay("location", "loc", go.Point.parse, go.Point.stringify);
  };

  const shapeStyle = (shape) => {
    shape.set({ strokeWidth: 0, portId: "", cursor: "pointer" });
  };

  const textStyle = (textblock) => {
    textblock
      .set({ font: "bold 11pt Figtree, sans-serif" })
      .theme("stroke", "text");
  };

  const initDiagram = () => {
    if (!diagramRef.current) return;

    const diagram = new go.Diagram(diagramRef.current, {
      "undoManager.isEnabled": true,
      "themeManager.changesDivBackground": true,
      "themeManager.currentTheme": "dark",
    });
    diagram.addDiagramListener("Modified", (e) => {
      const modified = diagram.isModified;
      setIsModified(modified);
      const idx = document.title.indexOf("*");
      if (modified) {
        if (idx < 0) document.title += "*";
      } else {
        if (idx >= 0) document.title = document.title.slice(0, idx);
      }
    });

    // Set up themes
    diagram.themeManager.set("light", {
      colors: {
        text: "#fff",
        start: "#064e3b",
        step: "#49939e",
        conditional: "#6a9a8a",
        end: "#7f1d1d",
        comment: "#a691cc",
        bgText: "#000",
        link: "#dcb263",
        linkOver: "#cbd5e1",
        div: "#ede9e0",
      },
    });

    diagram.themeManager.set("dark", {
      colors: {
        text: "#fff",
        step: "#414a8d",
        conditional: "#88afa2",
        comment: "#bfb674",
        bgText: "#fff",
        link: "#fdb71c",
        linkOver: "#475569",
        div: "#141e37",
      },
    });

    // Define node templates
    diagram.nodeTemplateMap.add(
      "step",
      new go.Node("Auto").apply(nodeStyle).add(
        new go.Shape("Rectangle", {
          fromLinkable: true,
          toLinkable: true,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
        })
          .apply(shapeStyle)
          .theme("fill", "step"),
        new go.TextBlock({
          margin: 12,
          maxSize: new go.Size(160, NaN),
          wrap: go.Wrap.Fit,
          editable: true,
        })
          .apply(textStyle)
          .bindTwoWay("text")
      )
    );

    diagram.nodeTemplateMap.add(
      "Conditional",
      new go.Node("Auto").apply(nodeStyle).add(
        new go.Shape("Conditional", {
          fromLinkable: true,
          toLinkable: true,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
        })
          .apply(shapeStyle)
          .theme("fill", "conditional"),
        new go.TextBlock({
          margin: 8,
          maxSize: new go.Size(160, NaN),
          wrap: go.Wrap.Fit,
          textAlign: "center", // Ensure text is centered
          editable: true,
        })
          .apply(textStyle)
          .bindTwoWay("text")
      )
    );

    // Add other node templates (Conditional, Start, End, Comment)
    diagram.nodeTemplateMap.add(
      "Start",
      new go.Node("Auto")
        .apply(nodeStyle)
        .add(
          new go.Shape("Capsule", { fromLinkable: true })
            .apply(shapeStyle)
            .theme("fill", "start"),
          new go.TextBlock("Start", { margin: new go.Margin(5, 6) })
            .apply(textStyle)
            .bindTwoWay("text")
        )
    );

    // Add End template
    diagram.nodeTemplateMap.add(
      "End",
      new go.Node("Auto")
        .apply(nodeStyle)
        .add(
          new go.Shape("Capsule", { toLinkable: true })
            .apply(shapeStyle)
            .theme("fill", "end"),
          new go.TextBlock("End", { margin: new go.Margin(5, 6) })
            .apply(textStyle)
            .bindTwoWay("text")
        )
    );
    // ... (similar to the original code)

    // Add Comment template
    diagram.nodeTemplateMap.add(
      "Comment",
      new go.Node("Auto").apply(nodeStyle).add(
        new go.Shape("File", { strokeWidth: 3 })
          .theme("fill", "div")
          .theme("stroke", "comment"),
        new go.TextBlock({
          margin: 8,
          maxSize: new go.Size(200, NaN),
          wrap: go.Wrap.Fit,
          textAlign: "center",
          editable: true,
        })
          .theme("stroke", "bgText")
          .bindTwoWay("text")
      )
    );

    // Define link template
    diagram.linkTemplate = new go.Link({
      routing: go.Routing.AvoidsNodes,
      curve: go.Curve.JumpOver,
      corner: 5,
      toShortLength: 4,
      relinkableFrom: true,
      relinkableTo: true,
      reshapable: true,
      resegmentable: true,
      mouseEnter: (e, link) =>
        (link.findObject("HIGHLIGHT").stroke =
          link.diagram.themeManager.findValue("linkOver", "colors")),
      mouseLeave: (e, link) =>
        (link.findObject("HIGHLIGHT").stroke = "transparent"),
      click: (e, link) => {
        setIsModalOpen(true);
      },
      contextClick: (e, link) => {
        e.diagram.model.commit((m) => {
          m.set(link.data, "text", "Label");
        });
      },
    })
      .bindTwoWay("points")
      .add(
        new go.Shape({
          isPanelMain: true,
          strokeWidth: 8,
          stroke: "transparent",
          name: "HIGHLIGHT",
        }),
        new go.Shape({ isPanelMain: true, strokeWidth: 2 }).theme(
          "stroke",
          "link"
        ),
        new go.Shape({ toArrow: "standard", strokeWidth: 0, scale: 1.5 }).theme(
          "fill",
          "link"
        ),
        new go.Panel("Auto", { visible: false })
          .bind("visible", "text", (t) => typeof t === "string" && t.length > 0)
          .add(
            new go.Shape("Ellipse", { strokeWidth: 0 }).theme(
              "fill",
              "div",
              null,
              null,
              (c) => new go.Brush("Radial", { 0: c, 0.5: `${c}00` })
            ),
            new go.TextBlock({
              name: "LABEL",
              font: "9pt Figtree, sans-serif",
              margin: 3,
              editable: true,
            })
              .theme("stroke", "bgText")
              .bindTwoWay("text")
          )
      );
    diagram.toolManager.linkingTool.temporaryLink.routing =
      go.Routing.Orthogonal;
    diagram.toolManager.relinkingTool.temporaryLink.routing =
      go.Routing.Orthogonal;

    // Load initial model
    diagram.model = go.Model.fromJson(initialModel);

    myDiagramRef.current = diagram;
    return diagram;
  };

  const initPalette = () => {
    if (!paletteRef.current || !myDiagramRef.current) return;

    const palette = new go.Palette(paletteRef.current, {
      nodeTemplateMap: myDiagramRef.current.nodeTemplateMap,
      themeManager: myDiagramRef.current.themeManager,
      model: new go.GraphLinksModel([
        { category: "Start", text: "Start" },
        { category: "step", text: "Step" },
        { category: "Conditional", text: "Conditional" },
        { category: "End", text: "End" },
        { category: "Comment", text: "Comment" },
      ]),
    });

    myPaletteRef.current = palette;
  };

  const handleLoad = () => {
    if (!myDiagramRef.current) return;

    try {
      const modelData = JSON.parse(modelText);
      myDiagramRef.current.model = go.Model.fromJson(modelData);
      myDiagramRef.current.isModified = false;
      setIsModified(false);
    } catch (e) {
      console.error("Error loading model:", e);
      alert("Error loading model: Invalid JSON data");
    }
  };

  const handleSave = () => {
    if (myDiagramRef.current) {
      try {
        // Get the model data using GoJS's toJson method
        const modelJson = myDiagramRef.current.model.toJson();
        // Parse and re-stringify to format it nicely
        const formattedJson = JSON.stringify(JSON.parse(modelJson), null, 2);
        setModelText(formattedJson);
        myDiagramRef.current.isModified = false;
        setIsModified(false);
      } catch (e) {
        console.error("Error saving model:", e);
        alert("Error saving model: " + e.message);
      }
    }
  };

  const handleThemeChange = (theme) => {
    if (myDiagramRef.current) {
      myDiagramRef.current.themeManager.currentTheme = theme;
    }
  };

  useEffect(() => {
    defineFigures();
    const diagram = initDiagram();
    if (diagram) {
      initPalette();
    }

    return () => {
      if (myDiagramRef.current) myDiagramRef.current.div = null;
      if (myPaletteRef.current) myPaletteRef.current.div = null;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-4">
        <select
          className="p-2 border rounded"
          onChange={(e) => handleThemeChange(e.target.value)}
          defaultValue="dark"
        >
          <option value="light">Light Theme</option>
          <option value="dark">Dark Theme</option>
        </select>
        <button
          className={`px-4 py-2 rounded ${
            isModified
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={handleSave}
          disabled={!isModified}
        >
          Save
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleLoad}
        >
          Load Model
        </button>
      </div>
      <div className="flex flex-col xl:flex-row gap-4">
        <textarea
          value={modelText}
          onChange={(e) => setModelText(e.target.value)}
          className="w-full h-48 p-2 font-mono text-sm border rounded"
          placeholder="Paste your model JSON here..."
        />
      </div>
      <div className="flex flex-col xl:flex-row gap-4 p-4">
        <div
          className="flex gap-4"
          style={{ width: "100%", height: "fit-content" }}
        >
          <div
            ref={paletteRef}
            style={{ width: "150px", marginRight: "2px" }}
            className="border rounded"
          />
          <div
            ref={diagramRef}
            style={{ flexGrow: 1, width: "1310px", height: "810px" }}
            className="border rounded"
          />
        </div>
      </div>
      <CheckModal open={isModalOpen} setOpen={setIsModalOpen} />
    </div>
  );
};

const CheckModal = ({ open, setOpen }) => {
  return (
    <>
      <Modal
        centered
        closable={false}
        title="Test Modal"
        open={open}
        footer={[
          <button
            key="add"
            onClick={() => {
              setOpen(false);
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Chart
          </button>,
          <button
            key="cancel"
            onClick={() => setOpen(false)}
            className="ml-2 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
          >
            Cancel
          </button>,
        ]}
      >
        <div className="grid grid-cols-3 gap-4">
          <button
            className={`p-4 cursor-pointer border rounded-lg border-blue-400 bg-blue-500`}
            onClick={() => {}}
          >
            <p className="text-center capitalize text-white">check</p>
          </button>
        </div>
      </Modal>
    </>
  );
};

export default FlowchartEditor;
