const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  content: { type: String, required: true, trim: true, maxlength: 20000 },
  tags: [{ type: String, trim: true, maxlength: 24 }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String, required: true },
  comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
