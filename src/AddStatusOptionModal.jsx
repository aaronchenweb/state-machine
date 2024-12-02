import { useState, useEffect } from "react";
import { Modal } from "antd";

const AddStatusOptionModal = ({ open, setOpen, modelText, setModelText }) => {
  const getNextKey = () => {
    try {
      const currentModel =
        typeof modelText === "string" ? JSON.parse(modelText) : modelText;

      // Get all existing keys as positive numbers
      const existingKeys = currentModel.nodeDataArray
        .map((node) => Math.abs(node.key))
        .sort((a, b) => a - b);

      // Find first missing number starting from 1
      let expectedKey = 1;
      for (const key of existingKeys) {
        if (key !== expectedKey) {
          return expectedKey;
        }
        expectedKey++;
      }
      return expectedKey;
    } catch (error) {
      console.error("Error in getNextKey:", error);
      return 1;
    }
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      id: getNextKey(),
    }));
  }, [modelText]);

  const [formData, setFormData] = useState({
    id: 1,
    name: "",
    description: "",
    color: "#ababab",
    meaning: "none",
  });

  const colorOptions = [
    { value: "#ababab", label: "Gray" },
    { value: "#ffab46", label: "Orange" },
    { value: "#00a85d", label: "Green" },
    { value: "#008248", label: "Dark Green" },
    { value: "#005c50", label: "Teal" },
  ];

  const meaningOptions = [
    { value: "obsolete", label: "Obsolete" },
    { value: "inProgress", label: "In progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorSelect = (color) => {
    setFormData((prev) => ({
      ...prev,
      color: color,
    }));
  };

  const handleSave = () => {
    setFormData({
      id: getNextKey(),
      name: "",
      description: "",
      color: "#ababab",
      meaning: "none",
    });
    const currentModel =
      typeof modelText === "string" ? JSON.parse(modelText) : modelText;

    const colorToCategory = {
      "#ababab": "notStart",
      "#ffab46": "draft",
      "#00a85d": "inReview",
      "#008248": "inApproval",
      "#005c50": "approved",
    };

    const newNodeKey = -formData.id;

    const newNode = {
      key: newNodeKey,
      category: colorToCategory[formData.color],
      text: formData.name,
      meaning: formData.meaning === "none" ? "--" : formData.meaning,
      description: formData.description,
    };

    const newLink = {
      from: -1, // Unset state
      to: newNodeKey,
      text: `To ${formData.name}`,
    };

    const updatedModel = {
      ...currentModel,
      nodeDataArray: [...currentModel.nodeDataArray, newNode],
      // linkDataArray: [...currentModel.linkDataArray, newLink],
    };

    setModelText(JSON.stringify(updatedModel, null, 2));
    setOpen(false);
  };

  return (
    <Modal
      title="Add Option..."
      open={open}
      onCancel={() => setOpen(false)}
      width={500}
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
      <div className="space-y-4">
        {/* <div className="flex items-center gap-2">
          <label className="w-24">Id:*</label>
          <div className="p-2 rounded w-full">{formData.id}</div>
        </div> */}

        <div className="flex items-center gap-2">
          <label className="w-20">Status:*</label>
          <div className="flex-1">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="p-2 border rounded w-full"
              required
            />
          </div>
          <div className="flex gap-1">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorSelect(color.value)}
                className={`w-6 h-6 rounded ${
                  formData.color === color.value ? "ring-2 ring-blue-500" : ""
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <label className="w-24">Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="p-2 border rounded w-full"
            rows={4}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="w-24">Meaning:</label>
          <div className="flex gap-4">
            {meaningOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="meaning"
                  value={option.value}
                  checked={formData.meaning === option.value}
                  onChange={handleInputChange}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddStatusOptionModal;
