import Package from "../models/package.js";

export const getPackages = async (req, res) => {
  res.json(await Package.find());
};

export const createPackage = async (req, res) => {
  const data = await Package.create(req.body);
  res.status(201).json(data);
};

export const updatePackage = async (req, res) => {
  const data = await Package.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(data);
};

export const deletePackage = async (req, res) => {
  await Package.findByIdAndDelete(req.params.id);
  res.json({ message: "Paket dihapus" });
};
