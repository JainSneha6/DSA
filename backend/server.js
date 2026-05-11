import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'

dotenv.config()

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: '*' }
})

const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// MongoDB Atlas connection
await mongoose.connect(process.env.MONGODB_URI)
console.log('Connected to MongoDB Atlas')

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled DSA Note',
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    tag: {
      type: String,
      trim: true,
      default: 'General',
    },
  },
  { timestamps: true }
)

const Note = mongoose.model('Note', noteSchema)

const formatNote = (note) => ({
  id: note._id.toString(),
  title: note.title,
  text: note.text,
  tag: note.tag,
  timestamp: note.updatedAt || note.createdAt,
})

// Get all notes
app.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 })
    res.json(notes.map(formatNote))
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notes' })
  }
})

// Add note
app.post('/notes', async (req, res) => {
  try {
    const { title, text, tag } = req.body

    const newNote = await Note.create({
      title: title?.trim() || 'Untitled DSA Note',
      text: text?.trim() || '',
      tag: tag?.trim() || 'General',
    })

    const formatted = formatNote(newNote)
    io.emit('note-added', formatted)

    res.status(201).json({ success: true, note: formatted })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create note' })
  }
})

// Update note
app.put('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, text, tag } = req.body

    const existing = await Note.findById(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Note not found' })
    }

    existing.title = title !== undefined ? title.trim() || existing.title : existing.title
    existing.text = text !== undefined ? text.trim() || existing.text : existing.text
    existing.tag = tag !== undefined ? tag.trim() || existing.tag : existing.tag

    await existing.save()

    const formatted = formatNote(existing)
    io.emit('note-updated', formatted)

    res.json({ success: true, note: formatted })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update note' })
  }
})

// Delete note
app.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params

    const deleted = await Note.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Note not found' })
    }

    io.emit('note-deleted', id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete note' })
  }
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
})