import { useState, useEffect } from "react";
import { Modal } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import * as go from "gojs";
import AddStatusOptionModal from "./AddStatusOptionModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableTableRow = ({ node, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging ? "rgb(243 244 246)" : undefined,
    cursor: "move",
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(node.key);
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {/* <td className="border px-4 py-2" {...attributes} {...listeners}>
        {Math.abs(node.key.toString())}
      </td> */}
      <td className="border px-4 py-2" {...attributes} {...listeners}>
        <div
          className={`px-2 py-1 rounded text-white w-fit
          ${node.category === "notStart" ? "bg-[#ababab]" : ""}
          ${node.category === "draft" ? "bg-[#ffab46]" : ""}
          ${node.category === "inReview" ? "bg-[#00a85d]" : ""}
          ${node.category === "inApproval" ? "bg-[#008248]" : ""}
          ${node.category === "approved" ? "bg-[#005c50]" : ""}
          ${node.category === "unset" ? "bg-gray-200 text-black" : ""}`}
        >
          {node.text}
        </div>
      </td>
      <td className="border px-4 py-2" {...attributes} {...listeners}>
        {node.meaning || "--"}
      </td>
      <td className="border px-4 py-2 text-center">
        <button
          onClick={handleDeleteClick}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <CloseOutlined className="h-4 w-4 text-gray-500" />
        </button>
      </td>
    </tr>
  );
};

const StatusOptionsModal = ({
  open,
  setOpen,
  modelText,
  setModelText,
  setCurrentModel,
  myDiagramRef,
  setIsModified,
}) => {
  const [nodeData, setNodeData] = useState([]);
  const [isAddOptionModalOpen, setIsAddOptionModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance for drag activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (modelText) {
      try {
        const currentModel =
          typeof modelText === "string" ? JSON.parse(modelText) : modelText;
        setNodeData(currentModel.nodeDataArray);
      } catch (error) {
        console.error("Error parsing modelText:", error);
      }
    }
  }, [modelText]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setNodeData((items) => {
        const oldIndex = items.findIndex((item) => item.key === active.id);
        const newIndex = items.findIndex((item) => item.key === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);

        // Update the model text with the new order
        const currentModel =
          typeof modelText === "string" ? JSON.parse(modelText) : modelText;
        const updatedModel = {
          ...currentModel,
          nodeDataArray: newArray,
        };
        setModelText(JSON.stringify(updatedModel, null, 2));

        return newArray;
      });
    }
  };

  const handleDelete = (keyToDelete) => {
    const updatedNodeData = nodeData.filter((node) => node.key !== keyToDelete);
    setNodeData(updatedNodeData);

    // Update the model text
    const currentModel =
      typeof modelText === "string" ? JSON.parse(modelText) : modelText;
    const updatedModel = {
      ...currentModel,
      nodeDataArray: updatedNodeData,
    };
    // setModelText(JSON.stringify(updatedModel, null, 2));
  };

  const handleAddOption = () => {
    setIsAddOptionModalOpen(true);
  };

  const handleSave = () => {
    const currentModel =
      typeof modelText === "string" ? JSON.parse(modelText) : modelText;
    const updatedModel = {
      ...currentModel,
      nodeDataArray: nodeData,
    };
    setModelText(JSON.stringify(updatedModel, null, 2));
    setCurrentModel(updatedModel);
    if (myDiagramRef.current) {
      myDiagramRef.current.model = go.Model.fromJson(updatedModel);
      myDiagramRef.current.isModified = false;
      setIsModified(false);
    }
    setOpen(false);
  };

  return (
    <Modal
      title="Status Options"
      open={open}
      onCancel={() => setOpen(false)}
      footer={[
        <button
          key="ok"
          onClick={handleSave}
          className="bg-sky-500 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded"
        >
          OK
        </button>,
        <button
          key="cancel"
          onClick={() => setOpen(false)}
          className="ml-2 bg-transparent hover:bg-sky-500 text-sky-700 font-semibold hover:text-white py-2 px-4 border border-sky-500 hover:border-transparent rounded"
        >
          Cancel
        </button>,
      ]}
    >
      <div className="min-h-[300px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {/* <th className="border px-4 py-2 text-left">Id</th> */}
              <th className="border px-4 py-2 text-left">Status</th>
              <th className="border px-4 py-2 text-left">Meaning</th>
              <th className="border px-4 py-2 text-center w-16">Action</th>
            </tr>
          </thead>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <tbody>
              <SortableContext
                items={nodeData.map((node) => node.key)}
                strategy={verticalListSortingStrategy}
              >
                {nodeData.map((node) => (
                  <SortableTableRow
                    key={node.key}
                    node={node}
                    onDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </tbody>
          </DndContext>
        </table>
        <button
          onClick={handleAddOption}
          className="mt-4 px-4 py-2 text-sky-500 hover:text-sky-600"
        >
          Add Option...
        </button>
      </div>
      {open && (
        <AddStatusOptionModal
          open={isAddOptionModalOpen}
          setOpen={setIsAddOptionModalOpen}
          modelText={modelText}
          setModelText={setModelText}
        />
      )}
    </Modal>
  );
};

export default StatusOptionsModal;
