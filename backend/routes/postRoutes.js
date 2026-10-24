
const router = require("express").Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const auth = require("../middleware/authMiddleware");

// GET ALL POSTS
router.get("/", async (_req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .select("-comments");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Load posts error:", error);
    res.status(500).json({ message: "Could not load posts." });
  }
});

// GET ONE POST
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID." });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ message: "Could not load post." });
  }
});

// CREATE POST
router.post("/", auth, async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();

    const tags = Array.isArray(req.body.tags)
      ? req.body.tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required.",
      });
    }

    const post = await Post.create({
      title,
      content,
      tags,
      author: req.user.id,
      authorName: req.user.name,
    });

    console.log("Post saved successfully:", post._id);
    console.log("Database:", Post.db.name);
    console.log("Collection:", Post.collection.name);

    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error);

    res.status(400).json({
      message: "Could not create post.",
      error: error.message,
    });
  }
});

// UPDATE POST
router.put("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID." });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (String(post.author) !== String(req.user.id)) {
      return res.status(403).json({
        message: "You can only edit your own posts.",
      });
    }

    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required.",
      });
    }

    post.title = title;
    post.content = content;

    if (Array.isArray(req.body.tags)) {
      post.tags = req.body.tags
        .map((tag) => String(tag).trim())
        .filter(Boolean)
        .slice(0, 5);
    }

    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error("Update post error:", error);
    res.status(400).json({ message: "Could not update post." });
  }
});

// DELETE POST
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID." });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (String(post.author) !== String(req.user.id)) {
      return res.status(403).json({
        message: "You can only delete your own posts.",
      });
    }

    await post.deleteOne();

    res.status(200).json({ message: "Post deleted." });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(400).json({ message: "Could not delete post." });
  }
});

// ADD COMMENT
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();

    if (!text) {
      return res.status(400).json({
        message: "Comment cannot be empty.",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    post.comments.push({
      text,
      author: req.user.id,
      authorName: req.user.name,
    });

    await post.save();

    res.status(201).json(post);
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(400).json({ message: "Could not add comment." });
  }
});

// DELETE COMMENT
router.delete("/:postId/comments/:commentId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    if (String(comment.author) !== String(req.user.id)) {
      return res.status(403).json({
        message: "You can only delete your own comments.",
      });
    }

    comment.deleteOne();
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(400).json({ message: "Could not delete comment." });
  }
});

module.exports = router;
