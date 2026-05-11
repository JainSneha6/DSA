import { useEffect, useState } from 'react'

export default function App() {
  const [notes, setNotes] = useState([])
  const [text, setText] = useState('')

  // FETCH NOTES
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch('http://localhost:5000/notes')

        const data = await response.json()

        setNotes(data)
      } catch (error) {
        console.log(error)
      }
    }

    fetchNotes()
  }, [])

  // ADD NOTE
  const addNote = async () => {
    if (!text.trim()) return

    try {
      const newNote = {
        id: Date.now(),
        text,
      }

      const updatedNotes = [newNote, ...notes]

      setNotes(updatedNotes)

      setText('')

      await fetch('http://localhost:5000/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNotes),
      })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6">
          <h1 className="text-4xl font-bold mb-6 text-center">
            My Notes
          </h1>

          <div className="flex gap-3 mb-6">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a note..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <button
              onClick={addNote}
              className="bg-blue-600 hover:bg-blue-700 transition px-5 py-3 rounded-xl font-semibold"
            >
              Add
            </button>
          </div>

          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-4"
              >
                <p className="text-slate-200">{note.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}