import express from "express";
import Call from "../models/Call.js";

const router = express.Router();

router.post("/call/:roomId/offer", async (req, res) => {
    try {
        const { roomId } = req.params;
        const { offer, callType } = req.body;
        await Call.findOneAndUpdate(
            { roomId },
            { offer, callType: callType || "video", answer: null, candidates: [] },
            { upsert: true, new: true }
        );
        res.sendStatus(200);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post("/call/:roomId/answer", async (req, res) => {
    try {
        const { roomId } = req.params;
        const { answer } = req.body;
        await Call.findOneAndUpdate({ roomId }, { answer });
        res.sendStatus(200);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post("/call/:roomId/candidate", async (req, res) => {
    try {
        const { roomId } = req.params;
        const { candidate } = req.body;
        await Call.findOneAndUpdate(
            { roomId },
            { $push: { candidates: candidate } },
            { upsert: true }
        );
        res.sendStatus(200);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get("/call/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;
        const call = await Call.findOne({ roomId });
        res.json(call || {});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete("/call/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;
        await Call.findOneAndDelete({ roomId });
        res.sendStatus(200);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
