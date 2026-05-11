import { useEffect, useState } from 'react'
import io from 'socket.io-client'

const socket = io('http://localhost:5000')

export default function App() {
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editText, setEditText] = useState('')

  const dsaTags = ['Array', 'String', 'LinkedList', 'Stack', 'Queue', 'Tree', 'Graph', 'DP', 'Heap', 'Greedy', 'Binary Search', 'Sliding Window', 'Bit Manipulation']
  const [selectedTag, setSelectedTag] = useState('')

  useEffect(() => {
    fetchNotes()

    // Real-time listeners
    socket.on('note-added', (newNote) => {
      setNotes(prev => [newNote, ...prev])
    })

    socket.on('note-updated', (updatedNote) => {
      setNotes(prev => prev.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ))
    })

    socket.on('note-deleted', (id) => {
      setNotes(prev => prev.filter(note => note.id !== id))
    })

    return () => {
      socket.off('note-added')
      socket.off('note-updated')
      socket.off('note-deleted')
    }
  }, [])

  const fetchNotes = async () => {
    try {
      const res = await fetch('http://localhost:5000/notes')
      const data = await res.json()
      setNotes(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const addNote = async () => {
    if (!text.trim()) return

    const newNote = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled DSA Note',
      text: text.trim(),
      tag: selectedTag || 'General',
      timestamp: new Date().toISOString(),
    }

    try {
      await fetch('http://localhost:5000/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      })
      setTitle('')
      setText('')
      setSelectedTag('')
    } catch (err) {
      console.error(err)
    }
  }

  const startEdit = (note) => {
    setEditingId(note.id)
    setEditTitle(note.title || '')
    setEditText(note.text)
  }

  const saveEdit = async () => {
    if (!editText.trim() || !editingId) return

    const updatedNote = {
      title: editTitle.trim() || 'Untitled DSA Note',
      text: editText.trim(),
      timestamp: new Date().toISOString(),
    }

    try {
      await fetch(`http://localhost:5000/notes/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNote),
      })
    } catch (err) {
      console.error(err)
    }

    setEditingId(null)
    setEditTitle('')
    setEditText('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditText('')
  }

  const deleteNote = async (id) => {
    try {
      await fetch(`http://localhost:5000/notes/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error(err)
    }
  }

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-[#0a0f1c] py-10 px-6 font-mono">
      <div className="max-w-5xl mx-auto">
        <div className="bg-[#121a2e] border border-[#1e2a4d] rounded-3xl shadow-2xl overflow-hidden relative">

          <div className="absolute left-0 top-0 bottom-0 w-16 bg-[#0a0f1c] flex flex-col items-center pt-8 gap-6 z-20 border-r border-[#1e2a4d]">
            {Array.from({ length: 26 }).map((_, i) => (
              <div key={i} className="w-9 h-9 border-4 border-[#334155] rounded-full" />
            ))}
          </div>

          <div className="pl-20 pr-12 py-12">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-5xl font-bold text-white">DSA Notebook</h1>
                <p className="text-emerald-400">● Live • Multiple users connected</p>
              </div>
            </div>

            {/* New Note Form */}
            <div className="mb-12 bg-[#1a2540] border border-slate-700 rounded-2xl p-8">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Problem Title (e.g. Two Sum - Optimal Solution)"
                className="w-full bg-transparent text-2xl font-semibold text-white outline-none mb-6 placeholder:text-slate-500"
              />

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your approach, code, complexity analysis..."
                rows={8}
                className="w-full bg-transparent text-slate-200 text-[17px] leading-relaxed outline-none resize-y"
              />

              <div className="flex gap-4 mt-6">
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="bg-[#1e2a4d] border border-slate-700 rounded-xl px-5 py-3 text-white"
                >
                  <option value="">Select Topic</option>
                  {dsaTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>

                <button
                  onClick={addNote}
                  className="bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-2xl font-semibold text-white flex-1 transition"
                >
                  Save Note
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-8">
              {notes.length === 0 && (
                <div className="text-center py-24 text-slate-400">
                  <div className="text-7xl mb-6">📓</div>
                  <p className="text-2xl">Notebook is empty</p>
                </div>
              )}

              {notes.map((note) => (
                <div key={note.id} className="bg-[#1a2540] border border-slate-700 rounded-2xl overflow-hidden group">
                  <div className="p-8">
                    {editingId === note.id ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-transparent text-2xl font-semibold text-white outline-none mb-4"
                      />
                    ) : (
                      <h2 className="text-2xl font-semibold text-white mb-4">{note.title}</h2>
                    )}

                    {editingId === note.id ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-transparent text-slate-200 leading-relaxed outline-none min-h-[160px]"
                        autoFocus
                      />
                    ) : (
                      <p className="text-slate-200 text-[17px] leading-relaxed whitespace-pre-wrap">
                        {note.text}
                      </p>
                    )}
                  </div>

                  <div className="px-8 py-5 border-t border-slate-700 bg-[#131d36] flex justify-between items-center text-sm">
                    <div className="flex items-center gap-4">
                      <span className="px-4 py-1 bg-blue-950 text-blue-400 rounded-full text-xs border border-blue-900">
                        {note.tag}
                      </span>
                      <span className="text-slate-500">{formatDate(note.timestamp)}</span>
                    </div>

                    <div className="flex gap-6 opacity-0 group-hover:opacity-100 transition">
                      {editingId === note.id ? (
                        <>
                          <button onClick={saveEdit} className="text-emerald-400 font-medium">Save</button>
                          <button onClick={cancelEdit} className="text-slate-400">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(note)} className="hover:text-white">Edit</button>
                          <button onClick={() => deleteNote(note.id)} className="text-red-400 hover:text-red-500">Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}