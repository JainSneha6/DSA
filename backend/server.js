import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

const NOTES_FILE = './notes.json'

// GET NOTES
app.get('/notes', async (req, res) => {
  try {
    const data = await fs.readFile(NOTES_FILE, 'utf8')

    const notes = JSON.parse(data)

    res.json(notes)
  } catch (error) {
    res.json([])
  }
})

// SAVE NOTES
app.post('/notes', async (req, res) => {
  try {
    await fs.writeFile(
      NOTES_FILE,
      JSON.stringify(req.body, null, 2)
    )

    res.json({
      success: true,
      message: 'Notes saved successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to save notes',
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})