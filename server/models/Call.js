import mongoose from "mongoose";

const callSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    callType: { type: String, default: "video" },
    offer: { type: Object, default: null },
    answer: { type: Object, default: null },
    candidates: { type: Array, default: [] }
}, { timestamps: true });

const Call = mongoose.model("Call", callSchema);
export default Call;
