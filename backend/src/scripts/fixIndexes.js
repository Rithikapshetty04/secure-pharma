require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    const userCollection = db.collection("users");
    const userIndexes = await userCollection.indexes();
    console.log("User indexes before:", userIndexes);

    for (const idx of userIndexes) {
      if (idx.name.includes("licenseNumber")) {
        console.log(`Dropping obsolete index ${idx.name}...`);
        await userCollection.dropIndex(idx.name);
      }
    }

    const remainingIndexes = await userCollection.indexes();
    console.log("User indexes after:", remainingIndexes);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Index fix error:", err.message);
  }
};

fixIndexes();
