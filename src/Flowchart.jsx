import { useEffect, useRef, useState } from "react";
import * as go from "gojs";
import { Modal } from "antd";
import StatusOptionsModal from "./StatusOptionsModal";

// Initial diagram model data
const initialModel = {
  class: "GraphLinksModel",
  pointsDigits: 0,
  nodeDataArray: [
    {
      key: -1,
      category: "unset",
      loc: "-381 -24",
      text: "Unset",
      meaning: "--",
    },
    { category: "notStart", text: "Not Start", key: -2, loc: "-380 78" },
    {
      category: "draft",
      text: "Draft",
      key: -3,
      loc: "-252 278",
    },
    {
      category: "inReview",
      text: "In Review",
      key: -4,
      loc: "-511 279",
    },
    {
      category: "inApproval",
      text: "In Approval",
      key: -5,
      loc: "-385 461",
    },
    {
      category: "approved",
      text: "Approved",
      key: -6,
      loc: "-328 683",
    },
  ],
  linkDataArray: [
    {
      from: -1,
      to: -2,
      text: "Create",
    },
    {
      from: -2,
      to: -3,
      text: "To Draft",
    },
    {
      from: -3,
      to: -2,
      text: "Back to Not Start",
    },
    {
      from: -3,
      to: -4,
      text: "To Review",
    },
    {
      from: -4,
      to: -3,
      text: "Back to Draft",
    },
    {
      from: -4,
      to: -5,
      text: "To Approval",
    },
    {
      from: -5,
      to: -4,
      text: "Back to Review",
    },
    {
      from: -5,
      to: -3,
      text: "Back to Draft",
    },
    {
      from: -5,
      to: -6,
      text: "To Approved",
    },
    {
      from: -6,
      to: -3,
      text: "Back to Draft",
    },
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
  const [selectedLink, setSelectedLink] = useState(null);

  const [currentModel, setCurrentModel] = useState(initialModel);

  const [isStatusOptionsModalOpen, setIsStatusOptionsModalOpen] =
    useState(false);

  const [isAddTransitionModalOpen, setIsAddTransitionModalOpen] =
    useState(false);

  // Define custom figures for node templates
  const defineFigures = () => {};

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
      "themeManager.currentTheme": "light",
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
        text: "#000",
        unsetText: "#000",
        unset: "#fff",
        notStart: "#ababab",
        draft: "#ffab46",
        inReview: "#00a85d",
        inApproval: "#008248",
        approved: "#005c50",
        bgText: "#000",
        link: "#dcb263",
        linkOver: "#cbd5e1",
        div: "#ede9e0",
      },
    });

    diagram.themeManager.set("dark", {
      colors: {
        text: "#fff",
        unsetText: "#000",
        notStart: "#ababab",
        draft: "#ffab46",
        inReview: "#00a85d",
        inApproval: "#008248",
        approved: "#005c50",
        bgText: "#fff",
        link: "#fdb71c",
        linkOver: "#475569",
        div: "#141e37",
      },
    });

    diagram.nodeTemplateMap.add(
      "unset",
      new go.Node("Auto").apply(nodeStyle).add(
        new go.Shape("Capsule", { fromLinkable: true })
          .apply(shapeStyle)
          .theme("fill", "unset"),
        new go.TextBlock({
          margin: new go.Margin(5, 6),
        })
          .theme("stroke", "unsetText")
          .bindTwoWay("text")
      )
    );

    // Define node templates
    diagram.nodeTemplateMap.add(
      "notStart",
      new go.Node("Auto").apply(nodeStyle).add(
        new go.Shape("Capsule", {
          fromLinkable: true,
          toLinkable: true,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
        })
          .apply(shapeStyle)
          .theme("fill", "notStart"),
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
      "draft",
      new go.Node("Auto").apply(nodeStyle).add(
        new go.Shape("Capsule", {
          fromLinkable: true,
          toLinkable: true,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
        })
          .apply(shapeStyle)
          .theme("fill", "draft"),
        new go.TextBlock({
          margin: 8,
          maxSize: new go.Size(160, NaN),
          wrap: go.Wrap.Fit,
          editable: true,
        })
          .apply(textStyle)
          .bindTwoWay("text")
      )
    );

    diagram.nodeTemplateMap.add(
      "inReview",
      new go.Node("Auto").apply(nodeStyle).add(
        new go.Shape("Capsule", {
          fromLinkable: true,
          toLinkable: true,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
        })
          .apply(shapeStyle)
          .theme("fill", "inReview"),
        new go.TextBlock({
          margin: 8,
          maxSize: new go.Size(160, NaN),
          wrap: go.Wrap.Fit,
          editable: true,
        })
          .apply(textStyle)
          .bindTwoWay("text")
      )
    );

    diagram.nodeTemplateMap.add(
      "inApproval",
      new go.Node("Auto").apply(nodeStyle).add(
        new go.Shape("Capsule", {
          fromLinkable: true,
          toLinkable: true,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
        })
          .apply(shapeStyle)
          .theme("fill", "inApproval"),
        new go.TextBlock({
          margin: 8,
          maxSize: new go.Size(160, NaN),
          wrap: go.Wrap.Fit,
          editable: true,
        })
          .apply(textStyle)
          .bindTwoWay("text")
      )
    );

    diagram.nodeTemplateMap.add(
      "approved",
      new go.Node("Auto").apply(nodeStyle).add(
        new go.Shape("Capsule", {
          fromLinkable: true,
          toLinkable: true,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
        })
          .apply(shapeStyle)
          .theme("fill", "approved"),
        new go.TextBlock({
          margin: 8,
          maxSize: new go.Size(160, NaN),
          wrap: go.Wrap.Fit,
          editable: true,
        })
          .apply(textStyle)
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
      doubleClick: (e, link) => {
        setSelectedLink({
          from: link.data.from.toString(),
          to: link.data.to.toString(),
          text: link.data.text,
        });
        setIsModalOpen(true);
      },
      // contextClick: (e, link) => {
      //   e.diagram.model.commit((m) => {
      //     m.set(link.data, "text", "Label");
      //   });
      // },
    })
      .bindTwoWay("points")
      .add(
        new go.Shape({
          isPanelMain: true,
          strokeWidth: 8,
          stroke: "transparent",
          name: "HIGHLIGHT",
          cursor: "Pointer",
        }),
        new go.Shape({ isPanelMain: true, strokeWidth: 2 }).theme(
          "stroke",
          "link"
        ),
        new go.Shape({ toArrow: "standard", strokeWidth: 0, scale: 1.5 }).theme(
          "fill",
          "link"
        ),
        new go.Panel("Auto", { visible: false, cursor: "Pointer" })
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
        { category: "unset", text: "Unset" },
        { category: "notStart", text: "Not Start" },
        { category: "draft", text: "Draft" },
        { category: "inReview", text: "In Review" },
        { category: "inApproval", text: "In Approval" },
        { category: "approved", text: "Approved" },
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
      setCurrentModel(modelData);
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
        setCurrentModel(JSON.parse(modelJson));
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

  const LinkDataTable = () => {
    const nodeDataArray = currentModel.nodeDataArray;
    const linkData = currentModel.linkDataArray;

    // Create a map of node keys to their text values
    const nodeNames = {};
    nodeDataArray.forEach((node) => {
      nodeNames[node.key.toString()] = node.text;
    });

    return (
      <div className="w-full max-w-4xl">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">
                From
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">To</th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Name
              </th>
            </tr>
          </thead>
          <tbody>
            {linkData.map((link, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">
                  {nodeNames[link.from.toString()]}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {nodeNames[link.to.toString()]}
                </td>
                <td
                  onClick={() => {
                    setSelectedLink({
                      from: link.from.toString(),
                      to: link.to.toString(),
                      text: link.text,
                    });
                    setIsModalOpen(true);
                  }}
                  className="border border-gray-300 px-4 py-2 text-cyan-500 cursor-pointer"
                >
                  {link.text}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const StateTransitionModal = ({
    open,
    setOpen,
    mode,
    selectedLink,
    nodeDataArray,
    modelText,
    setModelText,
    setCurrentModel,
    myDiagramRef,
    setIsModified,
  }) => {
    const [formData, setFormData] = useState({
      from: "",
      to: "",
      name: "",
      description: "",
      permitted: "Developer",
      hidden: false,
      automatic: false,
    });

    // Initialize form data based on mode and selectedLink
    useEffect(() => {
      if (mode === "edit" && selectedLink) {
        setFormData((prev) => ({
          ...prev,
          from: selectedLink.from,
          to: selectedLink.to,
          name: selectedLink.text,
        }));
      } else if (mode === "add" && nodeDataArray && nodeDataArray.length > 1) {
        setFormData((prev) => ({
          ...prev,
          from: nodeDataArray[0].key.toString(),
          to: nodeDataArray[1].key.toString(),
        }));
      }
    }, [mode, selectedLink, nodeDataArray, open]);

    const handleInputChange = (e) => {
      const { name, value, type } = e.target;

      // For checkboxes, handle checked state
      const finalValue = type === "checkbox" ? e.target.checked : value;

      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    };

    const handleModalSave = () => {
      if (!formData.from || !formData.to || !formData.name) {
        alert("Please fill in all required fields");
        return;
      }

      try {
        // Parse current model data
        const modelData = JSON.parse(modelText);

        let updatedModel;
        if (mode === "edit") {
          // Update existing link
          const updatedLinkDataArray = modelData.linkDataArray.map((link) => {
            if (
              link.from.toString() === selectedLink?.from &&
              link.to.toString() === selectedLink?.to &&
              link.text === selectedLink?.text
            ) {
              return {
                ...link,
                from: parseInt(formData.from),
                to: parseInt(formData.to),
                text: formData.name,
              };
            }
            return link;
          });

          updatedModel = {
            ...modelData,
            linkDataArray: updatedLinkDataArray,
          };
        } else {
          // Add new link
          const newLinkData = {
            from: parseInt(formData.from),
            to: parseInt(formData.to),
            text: formData.name,
          };

          updatedModel = {
            ...modelData,
            linkDataArray: [...modelData.linkDataArray, newLinkData],
          };
        }

        // Update all states
        setModelText(JSON.stringify(updatedModel, null, 2));
        setCurrentModel(updatedModel);

        // Load the updated model into the diagram
        if (myDiagramRef.current) {
          myDiagramRef.current.model = go.Model.fromJson(updatedModel);
          myDiagramRef.current.isModified = false;
          setIsModified(false);
        }

        setOpen(false);
      } catch (error) {
        console.error("Error updating model:", error);
        alert("Error updating model: " + error.message);
      }
    };

    return (
      <Modal
        centered
        title={
          mode === "edit" ? "Edit State Transition" : "Add State Transition"
        }
        open={open}
        width={800}
        closable={false}
        footer={[
          <button
            key="Save"
            onClick={handleModalSave}
            className="bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded"
          >
            Save
          </button>,
          <button
            key="cancel"
            onClick={() => setOpen(false)}
            className="ml-2 bg-transparent hover:bg-cyan-500 text-cyan-700 font-semibold hover:text-white py-2 px-4 border border-cyan-500 hover:border-transparent rounded"
          >
            Cancel
          </button>,
        ]}
      >
        <div className="space-y-4">
          {/* From and To row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block">
                From:<span className="text-red-500">*</span>
              </label>
              <select
                name="from"
                value={formData.from}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                {nodeDataArray.map((node) => (
                  <option key={node.key} value={node.key}>
                    {node.text}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block">
                To:<span className="text-red-500">*</span>
              </label>
              <select
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                {nodeDataArray.map((node) => (
                  <option key={node.key} value={node.key}>
                    {node.text}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Name row */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block">
                Name:<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Description row */}
          <div>
            <label className="block">Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Permitted row */}
          <div>
            <label className="block">
              Permitted:<span className="text-red-500">*</span>
            </label>
            <select
              name="permitted"
              value={formData.permitted}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="developer">Developer</option>
              <option value="external">External</option>
              <option value="FSE">Functional Safety Engineer</option>
              <option value="projectAdmin">Project Admin</option>
              <option value="projectLead">Project Lead</option>
              <option value="reviewerL0">Reviewer - L0</option>
              <option value="reviewerL1">Reviewer - L1</option>
              <option value="reviewerL2">Reviewer - L2</option>
              <option value="reviewerL3">Reviewer - L3</option>
              <option value="safetyManager">Safety Manager</option>
              <option value="VVEngineer">V&V Engineer</option>
            </select>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* <div className="flex gap-4">
        <select
          className="p-2 border rounded"
          onChange={(e) => handleThemeChange(e.target.value)}
          defaultValue="light"
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
      </div> */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="mt-4">
          <LinkDataTable />
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 mr-4"
            onClick={() => setIsStatusOptionsModalOpen(true)}
          >
            Add Status
          </button>
          <button
            className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
            onClick={() => setIsAddTransitionModalOpen(true)}
          >
            Add Transitions
          </button>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-4 p-4">
        <div
          className="flex gap-4"
          style={{ width: "100%", height: "fit-content" }}
        >
          {/* <div
            ref={paletteRef}
            style={{ width: "250px", marginRight: "2px" }}
            className="border rounded"
          /> */}
          <div
            ref={diagramRef}
            style={{ flexGrow: 1, width: "1310px", height: "810px" }}
            className="border rounded"
          />
        </div>
      </div>
      <StatusOptionsModal
        open={isStatusOptionsModalOpen}
        setOpen={setIsStatusOptionsModalOpen}
        modelText={modelText}
        setModelText={setModelText}
        setCurrentModel={setCurrentModel}
        myDiagramRef={myDiagramRef}
        setIsModified={setIsModified}
      />
      <StateTransitionModal
        open={isModalOpen}
        setOpen={setIsModalOpen}
        mode="edit"
        selectedLink={selectedLink}
        nodeDataArray={currentModel.nodeDataArray}
        modelText={modelText}
        setModelText={setModelText}
        setCurrentModel={setCurrentModel}
        myDiagramRef={myDiagramRef}
        setIsModified={setIsModified}
      />

      <StateTransitionModal
        open={isAddTransitionModalOpen}
        setOpen={setIsAddTransitionModalOpen}
        mode="add"
        nodeDataArray={currentModel.nodeDataArray}
        modelText={modelText}
        setModelText={setModelText}
        setCurrentModel={setCurrentModel}
        myDiagramRef={myDiagramRef}
        setIsModified={setIsModified}
      />
    </div>
  );
};

export default FlowchartEditor;
