"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
exports.closeDatabaseConnection = closeDatabaseConnection;
exports.connectToDatabase = connectToDatabase;
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_1 = require("mongodb");
dotenv_1.default.config();
const MONGO_CONNECT_URL = process.env.MONGO_CONNECT_URL;
if (!MONGO_CONNECT_URL) {
    console.error('MONGO_CONNECT_URL is not defined in the environment variables');
    process.exit(1);
}
const client = new mongodb_1.MongoClient(MONGO_CONNECT_URL);
exports.client = client;
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log('Connected to MongoDB');
            const db = client.db('TaskList');
            yield db.command({ ping: 1 });
            console.log('Ping successful');
            return db;
        }
        catch (error) {
            console.error('Failed to connect to MongoDB', error);
            throw error; // Propagate the error
        }
    });
}
// Function to close the connection
function closeDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.close();
            console.log('Disconnected from MongoDB');
        }
        catch (error) {
            console.error('Error closing MongoDB connection', error);
        }
    });
}
