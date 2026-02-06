import React, { useEffect, useState } from 'react';
import { getQABank, createQAEntry, updateQAEntry, deleteQAEntry } from '../utils/api';

interface QAEntry {
    id: string;
    question_text: string;
    answer_text: string;
    tags: string[];
    use_count: number;
    auto_saved: boolean;
    last_used_at: string | null;
    created_at: string;
    updated_at: string;
}

const QABank = () => {
    const [entries, setEntries] = useState<QAEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ question_text: '', answer_text: '', tags: '' });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const data = await getQABank();
            setEntries(data.answers || []);
        } catch (err) {
            console.error('Failed to fetch Q&A bank', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.question_text.trim() || !formData.answer_text.trim()) return;

        setSaving(true);
        setMessage('');

        try {
            const tags = formData.tags
                ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                : [];

            if (editingId) {
                await updateQAEntry(editingId, {
                    question_text: formData.question_text,
                    answer_text: formData.answer_text,
                    tags,
                });
                setMessage('Answer updated!');
            } else {
                await createQAEntry(formData.question_text, formData.answer_text, tags);
                setMessage('Answer saved!');
            }

            setFormData({ question_text: '', answer_text: '', tags: '' });
            setShowForm(false);
            setEditingId(null);
            await fetchEntries();
        } catch (err) {
            setMessage('Failed to save');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleEdit = (entry: QAEntry) => {
        setEditingId(entry.id);
        setFormData({
            question_text: entry.question_text,
            answer_text: entry.answer_text,
            tags: (entry.tags || []).join(', '),
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this Q&A entry?')) return;
        try {
            await deleteQAEntry(id);
            await fetchEntries();
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ question_text: '', answer_text: '', tags: '' });
    };

    const filtered_entries = searchQuery.trim()
        ? entries.filter(e =>
            e.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.answer_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : entries;

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 14px',
        marginBottom: '12px',
        boxSizing: 'border-box',
        fontSize: '14px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        outline: 'none',
        fontFamily: 'inherit',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '13px',
        fontWeight: 600,
        marginBottom: '6px',
        color: '#334155',
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Loading Q&A Bank...
            </div>
        );
    }

    return (
        <div style={{ padding: '4px' }}>
            {/* Header */}
            <div style={{
                marginBottom: '16px',
                background: '#fff',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#0f172a' }}>
                            Q&A Bank
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                            Save answers to common application questions. The AI will find and reuse
                            matching answers automatically during autofill.
                        </p>
                    </div>
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); setFormData({ question_text: '', answer_text: '', tags: '' }); }}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
                        }}
                    >
                        + Add Q&A
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div style={{
                    padding: '10px 14px',
                    marginBottom: '12px',
                    borderRadius: '8px',
                    background: message.includes('Failed') ? '#fef2f2' : '#f0fdf4',
                    color: message.includes('Failed') ? '#dc2626' : '#16a34a',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: `1px solid ${message.includes('Failed') ? '#fecaca' : '#bbf7d0'}`,
                }}>
                    {message}
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div style={{
                    marginBottom: '16px',
                    background: '#fff',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #c7d2fe',
                    boxShadow: '0 2px 8px rgba(79,70,229,0.1)',
                }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px', color: '#0f172a' }}>
                        {editingId ? 'Edit Q&A Entry' : 'New Q&A Entry'}
                    </h4>
                    <form onSubmit={handleSubmit}>
                        <label style={labelStyle}>Question</label>
                        <textarea
                            value={formData.question_text}
                            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                            placeholder="e.g., Why do you want to work at our company?"
                            rows={2}
                            style={{ ...inputStyle, resize: 'vertical' }}
                            required
                        />

                        <label style={labelStyle}>Your Answer</label>
                        <textarea
                            value={formData.answer_text}
                            onChange={(e) => setFormData({ ...formData, answer_text: e.target.value })}
                            placeholder="Your prepared answer for this type of question..."
                            rows={5}
                            style={{ ...inputStyle, resize: 'vertical' }}
                            required
                        />

                        <label style={labelStyle}>Tags (comma-separated, optional)</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="motivation, leadership, teamwork"
                            style={inputStyle}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    background: saving ? '#cbd5e1' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                    color: '#fff',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    color: '#64748b',
                                    border: '1px solid #e2e8f0',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            {entries.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search questions, answers, or tags..."
                        style={{
                            ...inputStyle,
                            marginBottom: 0,
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                        }}
                    />
                </div>
            )}

            {/* Entries List */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {filtered_entries.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: '#94a3b8',
                        fontSize: '14px',
                    }}>
                        {entries.length === 0
                            ? 'No saved answers yet. Click "+ Add Q&A" to get started.'
                            : 'No matches found.'}
                    </div>
                ) : (
                    filtered_entries.map((entry) => (
                        <div
                            key={entry.id}
                            style={{
                                background: '#fff',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                padding: '14px 16px',
                                marginBottom: '10px',
                                transition: 'box-shadow 0.2s',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', flex: 1 }}>
                                    {entry.question_text}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', marginLeft: '12px', flexShrink: 0 }}>
                                    <button
                                        onClick={() => handleEdit(entry)}
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: '11px',
                                            borderRadius: '6px',
                                            border: '1px solid #e2e8f0',
                                            background: '#f8fafc',
                                            color: '#475569',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: '11px',
                                            borderRadius: '6px',
                                            border: '1px solid #fecaca',
                                            background: '#fef2f2',
                                            color: '#dc2626',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div style={{
                                fontSize: '13px',
                                color: '#475569',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                maxHeight: '120px',
                                overflow: 'hidden',
                                marginBottom: '8px',
                            }}>
                                {entry.answer_text}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {(entry.tags || []).map((tag, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            background: '#e0e7ff',
                                            color: '#4338ca',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {entry.auto_saved && (
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '999px',
                                        background: '#fef3c7',
                                        color: '#92400e',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                    }}>
                                        AI-generated
                                    </span>
                                )}
                                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>
                                    Used {entry.use_count}x
                                    {entry.last_used_at && ` · Last: ${new Date(entry.last_used_at).toLocaleDateString()}`}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default QABank;

