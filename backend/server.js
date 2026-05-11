import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: "*" }
})

const PORT = 5000
const NOTES_FILE = './notes.json'

app.use(cors())
app.use(express.json())

// Initialize file
const initializeNotesFile = async () => {
  try {
    await fs.access(NOTES_FILE)
  } catch {
    await fs.writeFile(NOTES_FILE, JSON.stringify([], null, 2))
  }
}

// Get all notes
app.get('/notes', async (req, res) => {
  try {
    const data = await fs.readFile(NOTES_FILE, 'utf8')
    res.json(JSON.parse(data))
  } catch {
    res.json([])
  }
})

// Add Note
app.post('/notes', async (req, res) => {
  try {
    const { title, text, tag } = req.body
    const newNote = {
      id: Date.now().toString(),
      title: title?.trim() || 'Untitled DSA Note',
      text: text?.trim(),
      tag: tag || 'General',
      timestamp: new Date().toISOString(),
    }

    let notes = []
    try {
      const data = await fs.readFile(NOTES_FILE, 'utf8')
      notes = JSON.parse(data)
    } catch {}

    notes.unshift(newNote)
    await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2))

    io.emit('note-added', newNote)        // Real-time broadcast
    res.status(201).json({ success: true, note: newNote })
  } catch (error) {
    res.status(500).json({ success: false })
  }
})

// Update Note
app.put('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, text, tag } = req.body

    let notes = []
    try {
      const data = await fs.readFile(NOTES_FILE, 'utf8')
      notes = JSON.parse(data)
    } catch {}

    const index = notes.findIndex(n => n.id === id)
    if (index === -1) return res.status(404).json({ success: false })

    notes[index] = {
      ...notes[index],
      title: title?.trim() || notes[index].title,
      text: text?.trim() || notes[index].text,
      tag: tag || notes[index].tag,
      timestamp: new Date().toISOString(),
    }

    await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2))

    io.emit('note-updated', notes[index])   // Real-time
    res.json({ success: true, note: notes[index] })
  } catch (error) {
    res.status(500).json({ success: false })
  }
})

// Delete Note
app.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params
    let notes = []
    try {
      const data = await fs.readFile(NOTES_FILE, 'utf8')
      notes = JSON.parse(data)
    } catch {}

    notes = notes.filter(n => n.id !== id)
    await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2))

    io.emit('note-deleted', id)   // Real-time
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false })
  }
})

initializeNotesFile().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Real-time DSA Notebook running on http://localhost:${PORT}`)
  })
})