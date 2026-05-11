import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

const NOTES_FILE = './notes.json'

// Initialize file
const initializeNotesFile = async () => {
  try {
    await fs.access(NOTES_FILE)
  } catch {
    await fs.writeFile(NOTES_FILE, JSON.stringify([], null, 2))
  }
}

// GET ALL NOTES
app.get('/notes', async (req, res) => {
  try {
    const data = await fs.readFile(NOTES_FILE, 'utf8')
    const notes = JSON.parse(data)
    res.json(notes)
  } catch (error) {
    res.json([])
  }
})

// ADD NEW NOTE
app.post('/notes', async (req, res) => {
  try {
    const { title, text, tag } = req.body

    if (!text?.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' })
    }

    const newNote = {
      id: Date.now().toString(),
      title: title?.trim() || 'Untitled Note',
      text: text.trim(),
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

    res.status(201).json({ success: true, note: newNote })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Failed to add note' })
  }
})

// UPDATE NOTE
app.put('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, text, tag } = req.body

    let notes = []
    try {
      const data = await fs.readFile(NOTES_FILE, 'utf8')
      notes = JSON.parse(data)
    } catch {}

    const index = notes.findIndex(note => note.id === id)
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Note not found' })
    }

    notes[index] = {
      ...notes[index],
      title: title?.trim() || notes[index].title,
      text: text?.trim() || notes[index].text,
      tag: tag || notes[index].tag,
      timestamp: new Date().toISOString(),
    }

    await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2))

    res.json({ success: true, note: notes[index] })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Failed to update note' })
  }
})

// DELETE NOTE
app.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params

    let notes = []
    try {
      const data = await fs.readFile(NOTES_FILE, 'utf8')
      notes = JSON.parse(data)
    } catch {}

    const filteredNotes = notes.filter(note => note.id !== id)

    await fs.writeFile(NOTES_FILE, JSON.stringify(filteredNotes, null, 2))

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete note' })
  }
})

initializeNotesFile().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ DSA Notebook Server running on http://localhost:${PORT}`)
  })
})