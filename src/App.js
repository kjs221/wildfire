import React, { useState, useEffect } from 'react';
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Ranchers&family=Mynerve&family=Baloo+2:wght@400;500;600;700&display=swap');
  * { font-family: 'Baloo 2', sans-serif; }
`;
document.head.appendChild(style);
const WildfireDashboard = () => {
  const [currentView, setCurrentView] = useState('fire');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showReward, setShowReward] = useState(false);
  const [rewardAnimal, setRewardAnimal] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timeEntries, setTimeEntries] = useState({});

  // Streams state
  const [streams, setStreams] = useState([
    { id: '1', name: 'SBAC', color: '#e5ad34', capacity_hours: 20 },
    { id: '2', name: 'NEF', color: '#c7297d', capacity_hours: 10 },
    { id: '3', name: 'CSA', color: '#52a35f', capacity_hours: 10 },
    { id: '4', name: 'Castle Con', color: '#8f5ac4', capacity_hours: 5 },
    { id: '5', name: 'Life', color: '#34b0ef', capacity_hours: 5 },
  ]);

  // Bulk add state
  const [bulkText, setBulkText] = useState('');
  const [bulkItems, setBulkItems] = useState([]);
  const [bulkStream, setBulkStream] = useState('1');
  const [showPreview, setShowPreview] = useState(false);
  const SUPABASE_URL = 'https://mrmjzthkzikgzumhxeig.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9KN8kzjDwjbZN41zuVBgfA_snMIEjnH';
  const animals = [
    { name: 'raccoon', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop' },
    { name: 'stoat', url: 'https://images.unsplash.com/photo-1567270671170-fdc10a5bf831?w=500&h=500&fit=crop' },
    { name: 'tarsier', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&h=500&fit=crop' },
    { name: 'sugar glider', url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=500&fit=crop' },
    { name: 'highland cow', url: 'https://images.unsplash.com/photo-1564523072006-0f64ef1c09de?w=500&h=500&fit=crop' },
    { name: 'pika', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ochotona_hyperborea_yesoensis.jpg/320px-Ochotona_hyperborea_yesoensis.jpg' },
    { name: 'fennec fox', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Fennec_Fox_Photographed_at_Africa_Alive.jpg/320px-Fennec_Fox_Photographed_at_Africa_Alive.jpg' },
    { name: 'koala', url: 'https://images.unsplash.com/photo-1459751707576-f2a52dfb8ba5?w=500&h=500&fit=crop' },
    { name: 'aye aye', url: 'https://images.unsplash.com/photo-1496854496397-b6a895a09252?w=500&h=500&fit=crop' },
    { name: 'teacup pig', url: 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=500&h=500&fit=crop' },
  ];
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/projects?select=*,subtasks(*)&order=deadline.asc`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      setTasks(data || []);
      const entriesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/time_entries`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' } }
      );
      const entries = await entriesResponse.json();
      const entriesByProject = {};
      entries?.forEach(entry => {
        if (!entriesByProject[entry.project_id]) entriesByProject[entry.project_id] = [];
        entriesByProject[entry.project_id].push(entry);
      });
      setTimeEntries(entriesByProject);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchStreams = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/streams?select=*&order=id.asc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const fetched = data.map(s => ({ id: String(s.id), name: s.name, color: s.color, capacity_hours: s.capacity_hours || 0 }));
        setStreams(fetched);
        setBulkStream(fetched[0].id);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
    }
  };
  useEffect(() => { fetchProjects(); fetchStreams(); fetchHolidays(); }, []);
  const parseItems = () => {
    const lines = bulkText.split('\n').filter(line => line.trim().length > 0);
    const parsed = lines.map(line => ({
      title: line.replace(/^[•\-*]\s*/, '').trim(),
      startDate: '',
      deadline: '',
      estimatedHours: '',
      notes: '',
      assignType: 'project',
      parentProject: ''
    }));
    setBulkItems(parsed);
    setShowPreview(true);
  };
  const updateBulkItem = (idx, field, value) => {
    const newItems = [...bulkItems];
    newItems[idx][field] = value;
    setBulkItems(newItems);
  };
  const submitBulkItems = async () => {
    for (const item of bulkItems) {
      try {
        if (item.assignType === 'project') {
          const payload = { title: item.title, stream_id: parseInt(bulkStream), start_date: item.startDate || null, deadline: item.deadline || null, estimated_hours: parseFloat(item.estimatedHours) || 0 };
          let res = await fetch(`${SUPABASE_URL}/rest/v1/projects`,
            {
              method: 'POST',
              headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
              body: JSON.stringify(payload)
            }
          );
          if (!res.ok) {
            const errText = await res.text();
            console.error('Project insert failed:', res.status, errText);
            if (errText.includes('start_date')) {
              // Retry without start_date if the column doesn't exist yet
              const { start_date, ...fallbackPayload } = payload;
              res = await fetch(`${SUPABASE_URL}/rest/v1/projects`,
                {
                  method: 'POST',
                  headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                  body: JSON.stringify(fallbackPayload)
                }
              );
              if (!res.ok) console.error('Project insert retry failed:', res.status, await res.text());
            }
          }
        } else {
          const subPayload = { project_id: parseInt(item.parentProject), text: item.title, start_date: item.startDate || null, deadline: item.deadline || null, completed: false };
          let res = await fetch(`${SUPABASE_URL}/rest/v1/subtasks`,
            {
              method: 'POST',
              headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
              body: JSON.stringify(subPayload)
            }
          );
          if (!res.ok) {
            const errText = await res.text();
            console.error('Subtask insert failed:', res.status, errText);
            if (errText.includes('start_date') || errText.includes('deadline')) {
              const { start_date, deadline, ...fallbackPayload } = subPayload;
              res = await fetch(`${SUPABASE_URL}/rest/v1/subtasks`,
                {
                  method: 'POST',
                  headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                  body: JSON.stringify(fallbackPayload)
                }
              );
              if (!res.ok) console.error('Subtask insert retry failed:', res.status, await res.text());
            }
          }
        }
      } catch (error) {
        console.error('Error creating item:', error);
      }
    }
    setBulkText('');
    setBulkItems([]);
    setShowPreview(false);
    fetchProjects();
  };
  const toggleSubtask = async (projectId, subtaskId, currentCompleted) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/subtasks?id=eq.${subtaskId}`,
        {
          method: 'PATCH',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ completed: !currentCompleted })
        }
      );
      if (!currentCompleted) {
        const animal = animals[Math.floor(Math.random() * animals.length)];
        setRewardAnimal(animal);
        setShowReward(true);
        setTimeout(() => setShowReward(false), 3000);
      }
      fetchProjects();
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [subtaskDraft, setSubtaskDraft] = useState({ text: '', startDate: '', deadline: '', estimatedHours: '' });

  const saveSubtaskEdit = async (subtaskId) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/subtasks?id=eq.${subtaskId}`,
        {
          method: 'PATCH',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ text: subtaskDraft.text, start_date: subtaskDraft.startDate || null, deadline: subtaskDraft.deadline || null, estimated_hours: parseFloat(subtaskDraft.estimatedHours) || 0 })
        }
      );
      setEditingSubtaskId(null);
      fetchProjects();
    } catch (error) {
      console.error('Error saving subtask edit:', error);
    }
  };

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${mins}m ${secs}s`;
  };
  const daysUntilDeadline = (date) => {
    if (!date) return 'no deadline';
    const days = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'due today';
    if (days === 1) return 'due tomorrow';
    if (days < 0) return 'overdue';
    return `due in ${days} days`;
  };
  const getDeadlineColor = (date) => {
    if (!date) return 'bg-gray-400';
    const days = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'bg-red-400';
    if (days <= 2) return 'bg-orange-400';
    return 'bg-teal-500';
  };
  const getStreamColor = (streamId) => {
    const stream = streams.find(s => s.id === String(streamId));
    return stream ? stream.color : '#378ADD';
  };

  // Stream management handlers
  const addStream = () => {
    const tempId = String(Date.now());
    const newStream = { id: tempId, name: 'New stream', color: '#378ADD', capacity_hours: 0 };
    setStreams(prev => [...prev, newStream]);
    fetch(`${SUPABASE_URL}/rest/v1/streams`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ name: newStream.name, color: newStream.color, capacity_hours: 0 })
    }).then(async res => {
      if (res.ok) {
        const data = await res.json();
        const realId = String(data[0].id);
        setStreams(prev => prev.map(s => s.id === tempId ? { ...s, id: realId } : s));
      } else {
        console.error('Error creating stream:', await res.text());
      }
    }).catch(e => console.error('Error creating stream:', e));
  };
  const updateStream = (id, field, value) => {
    setStreams(streams.map(s => s.id === id ? { ...s, [field]: value } : s));
    fetch(`${SUPABASE_URL}/rest/v1/streams?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ [field]: value })
    }).catch(e => console.error('Error updating stream:', e));
  };
  const removeStream = (id) => {
    setStreams(streams.filter(s => s.id !== id));
    fetch(`${SUPABASE_URL}/rest/v1/streams?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }
    }).catch(e => console.error('Error deleting stream:', e));
  };

  // Holidays / time-off state
  const [holidays, setHolidays] = useState([]);
  const [capacityRangeStart, setCapacityRangeStart] = useState(() => new Date().toISOString().split('T')[0]);
  const [capacityRangeEnd, setCapacityRangeEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const fetchHolidays = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/holidays?select=*&order=start.asc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setHolidays(data.map(h => ({ id: String(h.id), label: h.label, start: h.start, end: h.end })));
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };
  const addHoliday = () => {
    const newId = String(Date.now());
    const today = new Date().toISOString().split('T')[0];
    const newHoliday = { id: newId, label: 'Time off', start: today, end: today };
    setHolidays([...holidays, newHoliday]);
    fetch(`${SUPABASE_URL}/rest/v1/holidays`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ label: newHoliday.label, start: newHoliday.start, end: newHoliday.end })
    }).then(() => fetchHolidays()).catch(e => console.error('Error creating holiday:', e));
  };
  const updateHoliday = (id, field, value) => {
    setHolidays(holidays.map(h => h.id === id ? { ...h, [field]: value } : h));
  };
  const saveHoliday = (id) => {
    const h = holidays.find(h => h.id === id);
    if (!h) return;
    fetch(`${SUPABASE_URL}/rest/v1/holidays?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ label: h.label, start: h.start, end: h.end })
    }).catch(e => console.error('Error saving holiday:', e));
  };
  const removeHoliday = (id) => {
    setHolidays(holidays.filter(h => h.id !== id));
    fetch(`${SUPABASE_URL}/rest/v1/holidays?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }
    }).catch(e => console.error('Error deleting holiday:', e));
  };

  const [manualHours, setManualHours] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskNotes, setTaskNotes] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  useEffect(() => {
    setTaskNotes(selectedTask?.notes || '');
    setTitleDraft(selectedTask?.title || '');
    setEditingTitle(false);
  }, [selectedTask]);

  const saveTaskTitle = async (newTitle) => {
    if (!selectedTask || !newTitle.trim() || newTitle === selectedTask.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ title: newTitle.trim() })
      });
      setSelectedTask({ ...selectedTask, title: newTitle.trim() });
      setEditingTitle(false);
      fetchProjects();
    } catch (error) {
      console.error('Error saving title:', error);
    }
  };

  const saveTaskDeadline = async (newDeadline) => {
    if (!selectedTask) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ deadline: newDeadline || null })
      });
      setSelectedTask({ ...selectedTask, deadline: newDeadline || null });
      fetchProjects();
    } catch (error) {
      console.error('Error saving deadline:', error);
    }
  };

  const saveTaskStartDate = async (newStartDate) => {
    if (!selectedTask) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ start_date: newStartDate || null })
      });
      setSelectedTask({ ...selectedTask, start_date: newStartDate || null });
      fetchProjects();
    } catch (error) {
      console.error('Error saving start date:', error);
    }
  };

  const getStartDate = (task) => {
    if (task.start_date) return task.start_date.split('T')[0];
    return new Date().toISOString().split('T')[0];
  };

  const completeTask = async (task) => {
    const completedDate = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${task.id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ completed: true, completed_date: completedDate })
      });
      if (!res.ok) {
        // Fallback if columns don't exist yet
        console.error('Complete task failed:', res.status, await res.text());
      }
      const animal = animals[Math.floor(Math.random() * animals.length)];
      setRewardAnimal(animal);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 3000);
      fetchProjects();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const uncompleteTask = async (taskId) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${taskId}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ completed: false, completed_date: null })
      });
      fetchProjects();
    } catch (error) {
      console.error('Error uncompleting task:', error);
    }
  };

  const [convertParent, setConvertParent] = useState('');
  const [batchDemoteSelected, setBatchDemoteSelected] = useState([]);
  const [batchDemoteParent, setBatchDemoteParent] = useState('');
  const [showBatchDemote, setShowBatchDemote] = useState(false);

  const toggleBatchSelect = (taskId) => {
    setBatchDemoteSelected(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const batchDemote = async () => {
    if (!batchDemoteParent || batchDemoteSelected.length === 0) return;
    for (const taskId of batchDemoteSelected) {
      const task = tasks.find(t => t.id === taskId);
      if (!task) continue;
      const subtaskPayload = {
        project_id: parseInt(batchDemoteParent),
        text: task.title,
        start_date: task.start_date || null,
        deadline: task.deadline || null,
        completed: false
      };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/subtasks`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(subtaskPayload)
      });
      if (!res.ok) { console.error('Batch demote failed for', task.title, await res.text()); continue; }
      if (task.subtasks && task.subtasks.length > 0) {
        for (const sub of task.subtasks) {
          await fetch(`${SUPABASE_URL}/rest/v1/subtasks?id=eq.${sub.id}`, {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ project_id: parseInt(batchDemoteParent), text: `${task.title}: ${sub.text}` })
          });
        }
      }
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${taskId}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }
      });
    }
    setBatchDemoteSelected([]);
    setBatchDemoteParent('');
    setShowBatchDemote(false);
    fetchProjects();
  };

  const saveEstimatedHours = async (hours) => {
    if (!selectedTask) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ estimated_hours: parseFloat(hours) || 0 })
      });
      setSelectedTask({ ...selectedTask, estimated_hours: parseFloat(hours) || 0 });
      fetchProjects();
    } catch (error) {
      console.error('Error saving estimated hours:', error);
    }
  };

  const saveSubtaskEstimatedHours = async (subtaskId, hours) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/subtasks?id=eq.${subtaskId}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ estimated_hours: parseFloat(hours) || 0 })
      });
      fetchProjects();
    } catch (error) {
      console.error('Error saving subtask estimated hours:', error);
    }
  };

  const convertToSubtask = async (taskId, parentId) => {
    if (!parentId || String(parentId) === String(taskId)) return;
    try {
      const subtaskPayload = {
        project_id: parseInt(parentId),
        text: selectedTask.title,
        start_date: selectedTask.start_date || null,
        deadline: selectedTask.deadline || null,
        completed: false
      };
      console.log('Demoting task with payload:', subtaskPayload);

      const res = await fetch(`${SUPABASE_URL}/rest/v1/subtasks`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(subtaskPayload)
      });

      const responseText = await res.text();
      console.log('Subtask creation response:', res.status, responseText);

      if (!res.ok) {
        console.error('Failed to create subtask, aborting demotion');
        alert(`Could not demote task: ${responseText}`);
        return;
      }

      // Move this task's own subtasks under the parent too
      if (selectedTask.subtasks && selectedTask.subtasks.length > 0) {
        for (const sub of selectedTask.subtasks) {
          await fetch(`${SUPABASE_URL}/rest/v1/subtasks?id=eq.${sub.id}`, {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ project_id: parseInt(parentId), text: `${selectedTask.title}: ${sub.text}` })
          });
        }
      }

      // Only delete the project once subtask is confirmed created
      const delRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${taskId}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }
      });
      console.log('Project deletion response:', delRes.status);

      setSelectedTask(null);
      setConvertParent('');
      fetchProjects();
    } catch (error) {
      console.error('Error converting to subtask:', error);
    }
  };

  const saveTaskNotes = async (notes) => {
    if (!selectedTask) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ notes })
      });
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/subtasks?project_id=eq.${taskId}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }
      });
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${taskId}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }
      });
      setSelectedTask(null);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };


  const logTimeEntry = (hours, date, notes = '') => {
    return fetch(`${SUPABASE_URL}/rest/v1/time_entries`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ project_id: selectedTask.id, hours, entry_date: date, notes })
    });
  };

  const TaskCard = ({ task }) => {
    const completedCount = task.subtasks?.filter(s => s.completed).length || 0;
    const totalCount = task.subtasks?.length || 0;
    return (
      <div
        className="bg-white p-4 shadow-md hover:shadow-lg transition-all"
        style={{ borderLeft: `10px solid ${getStreamColor(task.stream_id)}`, boxShadow: `-6px 0 0 0 rgba(255, 255, 255, 0.8), 0 2px 8px rgba(0, 0, 0, 0.08)`, borderRadius: '9px' }}
      >
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3
            style={{ fontFamily: "'Mynerve', cursive", fontSize: '18px', cursor: 'pointer' }}
            className="text-gray-900 flex-1 hover:underline"
            onClick={() => setSelectedTask(task)}
          >
            {task.title}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-semibold text-white px-3 py-1 whitespace-nowrap ${getDeadlineColor(task.deadline)}`} style={{ borderRadius: '9px' }}>
              {daysUntilDeadline(task.deadline)}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); completeTask(task); }}
              className="text-xs font-semibold px-3 py-1 whitespace-nowrap"
              style={{ borderRadius: '9px', background: '#1D9E75', color: '#fff' }}
              title="Mark complete"
            >
              ✓ Done
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-600 mb-2">{task.estimated_hours || 0}h estimated</p>
        <div className="w-full bg-gray-200 h-1 overflow-hidden mb-2" style={{ borderRadius: '9px' }}>
          <div className="h-full" style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%', background: 'linear-gradient(90deg, #975ab6, #ffa3a5)' }}></div>
        </div>
        <p className="text-xs text-gray-600">{completedCount} of {totalCount} subtasks done</p>
      </div>
    );
  };
  const navButtons = [
    { id: 'fire', label: 'On Fire Today', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z"/><path d="m5 22 14-4"/><path d="m5 18 14 4"/></svg> },
    { id: 'log', label: 'Add a log', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M11.013 18.582 6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16l2.309-4.679a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904L20 11.5"/><path d="M15 18h6"/><path d="M18 15v6"/></svg> },
    { id: 'smoke', label: "Where There's Smoke", icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg> },
    { id: 'hose', label: 'Get the Hose', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/></svg> },
    { id: 'sanity', label: 'Fire Drill', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 8h4"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M17 16h4"/><path d="M19 12V3"/><path d="M19 21v-5"/><path d="M3 14h4"/><path d="M5 10V3"/><path d="M5 21v-7"/></svg> },
  ];
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0097b2 0%, #0078a0 100%)' }}><p className="text-white text-2xl">Loading...</p></div>;
  }
  return (
    <div className="min-h-screen w-full" style={{ background: 'linear-gradient(135deg, #0097b2 0%, #0078a0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div
        className="w-full max-w-5xl"
        style={{
          background: 'linear-gradient(135deg, #ffd699, #7ed957, #caf5f7)',
          borderRadius: '13px',
          padding: '4px',
          boxSizing: 'border-box',
        }}
      >
        <div className="bg-white p-4 sm:p-8" style={{ borderRadius: '9px' }}>
          <div className="mb-6">
            <div className="flex items-start mb-4" style={{ gap: '8px' }}>
              <img
                src="/favicon.svg"
                alt="Wildfire flame"
                style={{ height: '60px', width: 'auto', flexShrink: 0, marginTop: '2px' }}
              />
              <h1
                style={{
                  fontFamily: "'Ranchers'",
                  fontSize: '60px',
                  letterSpacing: '2px',
                  marginTop: 0,
                  marginBottom: 0,
                  lineHeight: 1,
                  background: 'linear-gradient(79deg, #ffa3a5, #ffbf81 50%, #c52184 95%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Wildfire
              </h1>
            </div>
            <div className="flex flex-wrap" style={{ gap: '5px' }}>
              {navButtons.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setCurrentView(btn.id)}
                  className={`px-6 py-3 text-base font-medium transition-all flex items-center gap-2 border-2 ${currentView === btn.id ? 'shadow-lg' : 'bg-white hover:shadow-md'}`}
                  style={{ borderRadius: '9px', border: '2px solid #b872af', color: '#e97b84', background: currentView === btn.id ? '#f9eef9' : undefined }}
                >
                  <span className="flex-shrink-0">{btn.icon}</span>{btn.label}
                </button>
              ))}
            </div>
          </div>
          {currentView === 'fire' && !selectedTask && (
            <div>
              <h2 style={{ fontFamily: "'Ranchers', cursive", fontSize: '24px', color: '#0078a0', marginBottom: '1.5rem' }}>What's on Fire Today</h2>
              <div className="space-y-3">
                {(() => {
                  const taskItems = tasks
                    .filter(t => !t.completed && t.deadline)
                    .map(t => ({ type: 'task', item: t, deadline: t.deadline }));
                  const subtaskItems = tasks.flatMap(t =>
                    (t.subtasks || [])
                      .filter(s => !s.completed && s.deadline)
                      .map(s => ({ type: 'subtask', item: s, deadline: s.deadline, parent: t }))
                  );
                  return [...taskItems, ...subtaskItems]
                    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                    .slice(0, 4)
                    .map(entry => {
                      if (entry.type === 'task') {
                        return <TaskCard key={`task-${entry.item.id}`} task={entry.item} />;
                      }
                      const s = entry.item;
                      const parent = entry.parent;
                      return (
                        <div
                          key={`sub-${s.id}`}
                          className="bg-white p-4 shadow-md hover:shadow-lg transition-all cursor-pointer"
                          style={{ borderLeft: `10px solid ${getStreamColor(parent.stream_id)}`, borderRadius: '9px', boxShadow: `-6px 0 0 0 rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.08)` }}
                          onClick={() => setSelectedTask(parent)}
                        >
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <h3 style={{ fontFamily: "'Mynerve', cursive", fontSize: '18px' }} className="text-gray-900 flex-1">{s.text}</h3>
                            <span className={`text-xs font-semibold text-white px-3 py-1 whitespace-nowrap ${getDeadlineColor(s.deadline)}`} style={{ borderRadius: '9px' }}>{daysUntilDeadline(s.deadline)}</span>
                          </div>
                          <p className="text-xs text-gray-500">↳ {parent.title}</p>
                        </div>
                      );
                    });
                })()}
              </div>
            </div>
          )}
          {currentView === 'log' && !selectedTask && (
            <div>
              <h2 style={{ fontFamily: "'Ranchers', cursive", fontSize: '24px', color: '#0078a0', marginBottom: '1.5rem' }}>Add a Log to the Fire</h2>
              <div className="bg-gray-50 p-6 shadow-md space-y-6" style={{ borderRadius: '9px' }}>
                <div>
                  <h3 style={{ fontFamily: "'Mynerve', cursive", fontSize: '18px', marginBottom: '0.75rem' }} className="text-gray-900">Bulk add from summary</h3>
                  <p className="text-sm text-gray-600 mb-3">Paste action items (one per line)</p>
                  <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="• Design mockup&#10;• Get feedback&#10;• Finalize" rows="14" className="w-full px-4 py-3 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Stream (applies to all new projects)</label>
                  <select value={bulkStream} onChange={(e) => setBulkStream(e.target.value)} className="w-full px-4 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }}>
                    {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {showPreview && (
                  <div>
                    <h3 style={{ fontFamily: "'Mynerve', cursive", fontSize: '18px', marginBottom: '0.75rem' }} className="text-gray-900">Items to add ({bulkItems.length})</h3>
                    <div className="space-y-3 max-h-[32rem] overflow-y-auto">
                      {bulkItems.map((item, idx) => (
                        <div key={idx} className="bg-white p-4" style={{ borderRadius: '9px' }}>
                          <p className="font-semibold text-gray-900 mb-3">{item.title}</p>
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-700 mb-2">Assign as:</p>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name={`assignType-${idx}`} value="project" checked={item.assignType === 'project'} onChange={(e) => updateBulkItem(idx, 'assignType', e.target.value)} className="w-4 h-4" />
                                <span className="text-sm text-gray-700">New project</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name={`assignType-${idx}`} value="subtask" checked={item.assignType === 'subtask'} onChange={(e) => updateBulkItem(idx, 'assignType', e.target.value)} className="w-4 h-4" />
                                <span className="text-sm text-gray-700">Subtask of existing project</span>
                              </label>
                            </div>
                          </div>
                          {item.assignType === 'subtask' && (
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Parent project</label>
                              <select value={item.parentProject} onChange={(e) => updateBulkItem(idx, 'parentProject', e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }}>
                                <option value="">Select...</option>
                                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                              </select>
                            </div>
                          )}
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Start date</label>
                              <input type="date" value={item.startDate} onChange={(e) => updateBulkItem(idx, 'startDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Due date</label>
                              <input type="date" value={item.deadline} onChange={(e) => updateBulkItem(idx, 'deadline', e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Est. hours</label>
                              <input type="number" step="0.5" min="0" value={item.estimatedHours} onChange={(e) => updateBulkItem(idx, 'estimatedHours', e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                              <input type="text" value={item.notes} onChange={(e) => updateBulkItem(idx, 'notes', e.target.value)} placeholder="Optional" className="w-full px-3 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={parseItems}
                    className="w-1/3 py-3 text-white font-semibold text-base"
                    style={{ borderRadius: '9px', background: '#fcc495' }}
                  >
                    Make It Pretty
                  </button>
                  {showPreview && (
                    <button
                      onClick={submitBulkItems}
                      className="w-1/3 py-3 text-white font-semibold text-base ml-auto"
                      style={{ borderRadius: '9px', background: '#4a918b' }}
                    >
                      Throw A Log On The Fire
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {selectedTask && (
            <div className="mb-6">
              <button onClick={() => setSelectedTask(null)} className="text-blue-600 mb-4 hover:underline text-sm">← Back</button>
              <div className="bg-gray-50 p-6 shadow-md" style={{ borderRadius: '9px' }}>
                <div className="flex justify-between items-start mb-4 gap-4">
                  {editingTitle ? (
                    <input
                      type="text"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => saveTaskTitle(titleDraft)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveTaskTitle(titleDraft); if (e.key === 'Escape') setEditingTitle(false); }}
                      autoFocus
                      style={{ fontFamily: "'Mynerve', cursive", fontSize: '28px', borderRadius: '9px' }}
                      className="text-gray-900 flex-1 px-3 py-1 border border-gray-300 bg-white"
                    />
                  ) : (
                    <h2
                      style={{ fontFamily: "'Mynerve', cursive", fontSize: '28px' }}
                      className="text-gray-900 flex-1 cursor-pointer hover:underline"
                      onClick={() => setEditingTitle(true)}
                      title="Click to edit"
                    >
                      {selectedTask.title}
                    </h2>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this task and all its subtasks? This cannot be undone.')) {
                        deleteTask(selectedTask.id);
                      }
                    }}
                    className="px-4 py-2 bg-red-100 text-red-600 font-medium text-sm hover:bg-red-200 flex-shrink-0"
                    style={{ borderRadius: '9px' }}
                  >
                    Delete task
                  </button>
                </div>

                <div className="flex gap-2 items-end flex-wrap mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Make subtask of</label>
                    <div className="flex gap-2">
                      <select
                        value={convertParent}
                        onChange={(e) => setConvertParent(e.target.value)}
                        className="px-2 py-2 border border-gray-300 text-sm bg-white"
                        style={{ borderRadius: '9px' }}
                      >
                        <option value="">Select project...</option>
                        {tasks.filter(t => t.id !== selectedTask.id && String(t.stream_id) === String(selectedTask.stream_id)).map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (convertParent && window.confirm(`Move "${selectedTask.title}" to be a subtask of the selected project?`)) {
                            convertToSubtask(selectedTask.id, convertParent);
                          }
                        }}
                        disabled={!convertParent}
                        className="px-4 py-2 bg-blue-100 text-blue-700 font-medium text-sm hover:bg-blue-200 disabled:opacity-50"
                        style={{ borderRadius: '9px' }}
                      >
                        Move
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4 mb-6 pb-6 border-b">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Estimated</p>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      defaultValue={selectedTask.estimated_hours || 0}
                      onBlur={(e) => saveEstimatedHours(e.target.value)}
                      className="text-2xl font-bold text-blue-600 w-full border-b border-gray-300 bg-transparent"
                      style={{ outline: 'none' }}
                    />
                  </div>
                  <div><p className="text-xs text-gray-600 mb-1">Logged</p><p className="text-2xl font-bold text-purple-600">{(timeEntries[selectedTask.id] || []).reduce((sum, e) => sum + parseFloat(e.hours), 0).toFixed(1)}h</p></div>
                  <div><p className="text-xs text-gray-600 mb-1">Remaining</p><p className="text-2xl font-bold text-orange-600">{Math.max(0, (selectedTask.estimated_hours || 0) - (timeEntries[selectedTask.id] || []).reduce((sum, e) => sum + parseFloat(e.hours), 0)).toFixed(1)}h</p></div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Start date</p>
                    <input type="date" value={getStartDate(selectedTask)} onChange={(e) => saveTaskStartDate(e.target.value)} className="text-sm font-bold text-gray-900 px-2 py-1 border border-gray-300 bg-white" style={{ borderRadius: '9px' }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Deadline</p>
                    <input type="date" value={selectedTask.deadline ? selectedTask.deadline.split('T')[0] : ''} onChange={(e) => saveTaskDeadline(e.target.value)} className="text-sm font-bold text-gray-900 px-2 py-1 border border-gray-300 bg-white" style={{ borderRadius: '9px' }} />
                  </div>
                </div>
                {selectedTask.completed ? (
                  <div className="flex items-center gap-3 mb-6 p-3 bg-green-50" style={{ borderRadius: '9px' }}>
                    <span className="text-sm text-green-700 font-medium">✓ Completed {selectedTask.completed_date ? new Date(selectedTask.completed_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) : ''}</span>
                    <button onClick={() => uncompleteTask(selectedTask.id)} className="px-3 py-1 text-xs font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 ml-auto" style={{ borderRadius: '9px' }}>Reopen</button>
                  </div>
                ) : (
                  <div className="flex justify-end mb-6">
                    <button onClick={() => completeTask(selectedTask)} className="px-5 py-2 text-sm font-semibold text-white" style={{ borderRadius: '9px', background: '#1D9E75' }}>✓ Mark Complete</button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
                  <div>
                    <h3 style={{ fontFamily: "'Mynerve', cursive", fontSize: '18px', marginBottom: '1rem' }} className="text-gray-900">Time tracker</h3>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 text-center" style={{ borderRadius: '9px' }}>
                      <p className="text-5xl font-bold text-blue-600 font-mono mb-4">{formatTime(timerSeconds)}</p>
                      <div className="flex gap-3 justify-center">
                        {!timerActive ? (
                          <button onClick={() => setTimerActive(true)} className="px-8 py-3 bg-green-500 text-white font-bold text-lg" style={{ borderRadius: '9px' }}>▶ Start</button>
                        ) : (
                          <button onClick={() => { setTimerActive(false); const hours = parseFloat((timerSeconds / 3600).toFixed(2)); fetch(`${SUPABASE_URL}/rest/v1/time_entries`, { method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify({ project_id: selectedTask.id, hours, entry_date: new Date().toISOString().split('T')[0], notes: '' }) }).then(() => { setTimerSeconds(0); fetchProjects(); }).catch(e => console.error(e)); }} className="px-8 py-3 bg-red-500 text-white font-bold text-lg" style={{ borderRadius: '9px' }}>⏹ Stop</button>
                        )}
                        <button onClick={() => setTimerSeconds(0)} className="px-8 py-3 bg-gray-400 text-white font-bold text-lg" style={{ borderRadius: '9px' }}>Reset</button>
                      </div>
                    </div>
                    <div className="mt-4 bg-white p-4" style={{ borderRadius: '9px' }}>
                      <p className="text-sm font-medium text-gray-900 mb-2">Forgot to stop the timer? Log time manually:</p>
                      <div className="flex gap-3 items-end flex-wrap">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                          <input type="number" step="0.1" min="0" value={manualHours} onChange={(e) => setManualHours(e.target.value)} placeholder="e.g. 1.5" className="w-28 px-3 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                          <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="px-3 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                        </div>
                        <button
                          onClick={() => {
                            const hours = parseFloat(manualHours);
                            if (!hours || hours <= 0) return;
                            logTimeEntry(hours, manualDate).then(() => { setManualHours(''); fetchProjects(); }).catch(e => console.error(e));
                          }}
                          className="px-6 py-2 bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
                          style={{ borderRadius: '9px' }}
                        >
                          Log time
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Mynerve', cursive", fontSize: '18px', marginBottom: '1rem' }} className="text-gray-900">Notes</h3>
                    <textarea
                      value={taskNotes}
                      onChange={(e) => setTaskNotes(e.target.value)}
                      onBlur={() => saveTaskNotes(taskNotes)}
                      placeholder="Add notes about this task..."
                      className="w-full px-4 py-3 border border-gray-300 text-sm bg-white"
                      style={{ borderRadius: '9px', height: '100%', minHeight: '220px', resize: 'vertical' }}
                    />
                  </div>
                </div>
                <div className="mb-6 pb-6 border-b">
                  <h3 style={{ fontFamily: "'Mynerve', cursive", fontSize: '18px', marginBottom: '0.75rem' }} className="text-gray-900">Subtasks</h3>
                  <div className="space-y-2">
                    {[...(selectedTask.subtasks || [])].sort((a, b) => {
                      if (!a.deadline && !b.deadline) return 0;
                      if (!a.deadline) return 1;
                      if (!b.deadline) return -1;
                      return new Date(a.deadline) - new Date(b.deadline);
                    }).map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-3 bg-white" style={{ borderRadius: '9px' }}>
                        <input
                          type="checkbox"
                          checked={s.completed}
                          onChange={() => toggleSubtask(selectedTask.id, s.id, s.completed)}
                          className="w-4 h-4 accent-purple-600 flex-shrink-0"
                        />
                        {editingSubtaskId === s.id ? (
                          <div className="flex-1 flex gap-2 items-center flex-wrap">
                            <input
                              type="text"
                              value={subtaskDraft.text}
                              onChange={(e) => setSubtaskDraft({ ...subtaskDraft, text: e.target.value })}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveSubtaskEdit(s.id); if (e.key === 'Escape') setEditingSubtaskId(null); }}
                              autoFocus
                              className="flex-1 px-2 py-1 border border-gray-300 text-sm"
                              style={{ borderRadius: '9px', minWidth: '120px' }}
                            />
                            <div className="flex items-center gap-1">
                              <label className="text-xs text-gray-500">Start</label>
                              <input type="date" value={subtaskDraft.startDate} onChange={(e) => setSubtaskDraft({ ...subtaskDraft, startDate: e.target.value })} className="px-2 py-1 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                            </div>
                            <div className="flex items-center gap-1">
                              <label className="text-xs text-gray-500">Due</label>
                              <input type="date" value={subtaskDraft.deadline} onChange={(e) => setSubtaskDraft({ ...subtaskDraft, deadline: e.target.value })} className="px-2 py-1 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                            </div>
                            <div className="flex items-center gap-1">
                              <label className="text-xs text-gray-500">Hrs</label>
                              <input type="number" step="0.5" min="0" value={subtaskDraft.estimatedHours} onChange={(e) => setSubtaskDraft({ ...subtaskDraft, estimatedHours: e.target.value })} placeholder="0" className="w-16 px-2 py-1 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                            </div>
                            <button onClick={() => saveSubtaskEdit(s.id)} className="px-3 py-1 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" style={{ borderRadius: '9px' }}>Save</button>
                            <button onClick={() => setEditingSubtaskId(null)} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300" style={{ borderRadius: '9px' }}>Cancel</button>
                          </div>
                        ) : (
                          <div
                            className="flex-1 flex items-center justify-between gap-2 cursor-pointer hover:underline"
                            onClick={() => { setEditingSubtaskId(s.id); setSubtaskDraft({ text: s.text, startDate: s.start_date ? s.start_date.split('T')[0] : '', deadline: s.deadline ? s.deadline.split('T')[0] : '', estimatedHours: s.estimated_hours || '' }); }}
                            title="Click to edit"
                          >
                            <span className={`text-sm ${s.completed ? 'line-through text-gray-400' : ''}`}>{s.text}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {s.estimated_hours > 0 && <span className="text-xs text-gray-400">{s.estimated_hours}h</span>}
                              {s.deadline && <span className="text-xs text-gray-400">{daysUntilDeadline(s.deadline)}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {currentView === 'sanity' && !selectedTask && (
            <div>
              <h2 style={{ fontFamily: "'Ranchers', cursive", fontSize: '24px', color: '#0078a0', marginBottom: '1.5rem' }}>Fire Drill — Manage Streams</h2>
              {(() => {
                const rangeStart = new Date(capacityRangeStart);
                const rangeEnd = new Date(capacityRangeEnd);
                const rangeDays = Math.max(1, Math.ceil((rangeEnd - rangeStart) / 86400000) + 1);
                const rangeWeeks = rangeDays / 7;
                const tasksInRange = tasks.filter(t => {
                  if (!t.deadline) return false;
                  const d = new Date(t.deadline);
                  return d >= rangeStart && d <= rangeEnd;
                });
                const totalUsed = tasksInRange.reduce((sum, t) => {
                  const taskHours = t.estimated_hours || 0;
                  const subtaskHours = (t.subtasks || []).filter(s => !s.completed).reduce((sh, s) => sh + (s.estimated_hours || 0), 0);
                  return sum + taskHours + subtaskHours;
                }, 0);
                const totalCapacity = streams.reduce((sum, s) => sum + (s.capacity_hours || 0), 0) * rangeWeeks;
                const totalPct = totalCapacity > 0 ? Math.min(100, (totalUsed / totalCapacity) * 100) : 0;
                const totalOver = totalCapacity > 0 && totalUsed > totalCapacity;
                return (
                  <div className="bg-gray-50 p-6 shadow-md mb-4" style={{ borderRadius: '9px' }}>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 style={{ fontFamily: "'Mynerve', cursive", fontSize: '18px' }} className="text-gray-900">Cumulative capacity</h3>
                      <div className="flex items-center gap-2 ml-auto">
                        <label className="text-xs text-gray-600">From</label>
                        <input type="date" value={capacityRangeStart} onChange={(e) => setCapacityRangeStart(e.target.value)} className="px-2 py-1 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                        <label className="text-xs text-gray-600">to</label>
                        <input type="date" value={capacityRangeEnd} onChange={(e) => setCapacityRangeEnd(e.target.value)} className="px-2 py-1 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 h-4 overflow-hidden" style={{ borderRadius: '9px' }}>
                      <div className="h-full" style={{ width: `${totalPct}%`, background: totalOver ? '#ff5757' : '#2a9d8f', borderRadius: '9px' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalUsed.toFixed(1)}h scheduled / {totalCapacity.toFixed(1)}h capacity over {rangeDays} days ({rangeWeeks.toFixed(1)} weeks)
                      {totalOver ? ' — over capacity' : ''}
                    </p>
                  </div>
                );
              })()}
              <div className="bg-gray-50 p-6 shadow-md space-y-4" style={{ borderRadius: '9px' }}>
                {streams.map(s => {
                  const usedHours = tasks.filter(t => String(t.stream_id) === s.id).reduce((sum, t) => {
                    const taskHours = t.estimated_hours || 0;
                    const subtaskHours = (t.subtasks || []).filter(sub => !sub.completed).reduce((sh, sub) => sh + (sub.estimated_hours || 0), 0);
                    return sum + taskHours + subtaskHours;
                  }, 0);
                  const capacity = s.capacity_hours || 0;
                  const pct = capacity > 0 ? Math.min(100, (usedHours / capacity) * 100) : 0;
                  const overCapacity = capacity > 0 && usedHours > capacity;
                  return (
                    <div key={s.id} className="bg-white p-3" style={{ borderRadius: '9px' }}>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={/^#[0-9A-Fa-f]{6}$/.test(s.color) ? s.color : '#378ADD'}
                            onChange={(e) => updateStream(s.id, 'color', e.target.value)}
                            className="w-9 h-9 border border-gray-300 cursor-pointer flex-shrink-0 p-0"
                            style={{ borderRadius: '9px' }}
                          />
                          <input
                            type="text"
                            value={s.color}
                            onChange={(e) => updateStream(s.id, 'color', e.target.value)}
                            placeholder="#RRGGBB"
                            className="w-24 px-2 py-2 border border-gray-300 text-sm font-mono"
                            style={{ borderRadius: '9px' }}
                          />
                        </div>
                        <input type="text" value={s.name} onChange={(e) => updateStream(s.id, 'name', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Capacity (h/wk)</label>
                          <input
                            type="number"
                            min="0"
                            value={s.capacity_hours || 0}
                            onChange={(e) => updateStream(s.id, 'capacity_hours', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-2 border border-gray-300 text-sm"
                            style={{ borderRadius: '9px' }}
                          />
                        </div>
                        <button onClick={() => removeStream(s.id)} className="px-4 py-2 bg-red-100 text-red-600 font-medium text-sm hover:bg-red-200" style={{ borderRadius: '9px' }}>Remove</button>
                      </div>
                      {capacity > 0 && (
                        <div>
                          <div className="w-full bg-gray-200 h-3 overflow-hidden" style={{ borderRadius: '9px' }}>
                            <div className="h-full" style={{ width: `${pct}%`, background: overCapacity ? '#ff5757' : '#2a9d8f', borderRadius: '9px' }}></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{usedHours.toFixed(1)}h / {capacity}h {overCapacity ? '(over capacity)' : ''}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button onClick={addStream} className="px-6 py-3 bg-blue-600 text-white font-semibold text-base hover:bg-blue-700" style={{ borderRadius: '9px' }}>+ Add stream</button>
              </div>
              <h2 style={{ fontFamily: "'Ranchers', cursive", fontSize: '24px', color: '#0078a0', marginTop: '2rem', marginBottom: '1.5rem' }}>Time Off / Holidays (blocks out Gantt)</h2>
              <div className="bg-gray-50 p-6 shadow-md space-y-4" style={{ borderRadius: '9px' }}>
                {holidays.map(h => (
                  <div key={h.id} className="flex items-center gap-3 bg-white p-3 flex-wrap" style={{ borderRadius: '9px' }}>
                    <input type="text" value={h.label} onChange={(e) => updateHoliday(h.id, 'label', e.target.value)} onBlur={() => saveHoliday(h.id)} placeholder="Label" className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start</label>
                      <input type="date" value={h.start} onChange={(e) => updateHoliday(h.id, 'start', e.target.value)} onBlur={() => saveHoliday(h.id)} className="px-3 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End</label>
                      <input type="date" value={h.end} onChange={(e) => updateHoliday(h.id, 'end', e.target.value)} onBlur={() => saveHoliday(h.id)} className="px-3 py-2 border border-gray-300 text-sm" style={{ borderRadius: '9px' }} />
                    </div>
                    <button onClick={() => saveHoliday(h.id)} className="px-4 py-2 bg-blue-100 text-blue-700 font-medium text-sm hover:bg-blue-200" style={{ borderRadius: '9px' }}>Save</button>
                    <button onClick={() => removeHoliday(h.id)} className="px-4 py-2 bg-red-100 text-red-600 font-medium text-sm hover:bg-red-200" style={{ borderRadius: '9px' }}>Remove</button>
                  </div>
                ))}
                <button onClick={addHoliday} className="px-6 py-3 bg-blue-600 text-white font-semibold text-base hover:bg-blue-700" style={{ borderRadius: '9px' }}>+ Add time off</button>
              </div>
            </div>
          )}
          {currentView === 'smoke' && !selectedTask && (
            <div>
              <h2 style={{ fontFamily: "'Ranchers', cursive", fontSize: '24px', color: '#0078a0', marginBottom: '1rem' }}>Where There's Smoke (Pipeline)</h2>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <button
                  onClick={() => { setShowBatchDemote(!showBatchDemote); setBatchDemoteSelected([]); setBatchDemoteParent(''); }}
                  className="px-4 py-2 text-sm font-medium text-white"
                  style={{ borderRadius: '9px', background: showBatchDemote ? '#888' : 'linear-gradient(90deg, #975ab6, #ffa3a5)', boxShadow: showBatchDemote ? 'none' : '0 2px 8px rgba(151,90,182,0.3)' }}
                >
                  {showBatchDemote ? '✕ Cancel batch demote' : 'Batch demote tasks'}
                </button>
                {showBatchDemote && batchDemoteSelected.length > 0 && (() => {
                  const selectedStreamIds = [...new Set(batchDemoteSelected.map(id => {
                    const t = tasks.find(t => t.id === id);
                    return t ? String(t.stream_id) : null;
                  }).filter(Boolean))];
                  const singleStream = selectedStreamIds.length === 1 ? selectedStreamIds[0] : null;
                  const parentOptions = tasks.filter(t =>
                    !batchDemoteSelected.includes(t.id) &&
                    (singleStream ? String(t.stream_id) === singleStream : true)
                  );
                  return (
                    <div className="flex items-center gap-2 flex-wrap">
                      {!singleStream && <span className="text-xs text-orange-600">Selected tasks span multiple streams — showing all projects</span>}
                      <select
                        value={batchDemoteParent}
                        onChange={(e) => setBatchDemoteParent(e.target.value)}
                        className="px-3 py-2 border border-gray-300 text-sm bg-white"
                        style={{ borderRadius: '9px' }}
                      >
                        <option value="">Move {batchDemoteSelected.length} selected to...</option>
                        {parentOptions.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (batchDemoteParent && window.confirm(`Demote ${batchDemoteSelected.length} task(s) as subtasks of the selected project?`)) {
                            batchDemote();
                          }
                        }}
                        disabled={!batchDemoteParent}
                        className="px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        style={{ borderRadius: '9px', background: '#4a918b' }}
                      >
                        Confirm demote
                      </button>
                    </div>
                  );
                })()}
              </div>
              {tasks.length === 0 ? (
                <div className="bg-gray-50 p-8 shadow-md text-center" style={{ borderRadius: '9px' }}><p className="text-gray-600 text-lg">No projects yet.</p></div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {streams.map(stream => {
                    const colTasks = tasks.filter(t => String(t.stream_id) === stream.id);
                    const incomplete = colTasks.filter(t => !t.completed).sort((a, b) => {
                      if (!a.deadline && !b.deadline) return 0;
                      if (!a.deadline) return 1;
                      if (!b.deadline) return -1;
                      return new Date(a.deadline) - new Date(b.deadline);
                    });
                    const completed = colTasks.filter(t => t.completed).sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date));
                    const sortedTasks = [...incomplete, ...completed];
                    return (
                      <div key={stream.id} className="flex-shrink-0 w-64 bg-gray-50 p-3" style={{ borderRadius: '9px' }}>
                        <h3 className="font-semibold mb-3 px-1 flex items-center gap-2" style={{ color: stream.color, fontSize: '16.8px' }}>
                          <span className="inline-block w-3 h-3" style={{ background: stream.color, borderRadius: '4px' }}></span>
                          {stream.name} ({colTasks.length})
                        </h3>
                        <div className="space-y-2">
                          {sortedTasks.map(task => {
                            const completedCount = task.subtasks?.filter(s => s.completed).length || 0;
                            const totalCount = task.subtasks?.length || 0;
                            const isCompleted = task.completed;
                            const noDeadline = !task.deadline && !isCompleted;
                            const isSelected = batchDemoteSelected.includes(task.id);
                            const completedDate = task.completed_date ? new Date(task.completed_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) : '';
                            const displayTitle = isCompleted ? `DONE [${completedDate}] - ${task.title}` : task.title;
                            return (
                              <div
                                key={task.id}
                                onClick={() => showBatchDemote && !isCompleted ? toggleBatchSelect(task.id) : setSelectedTask(task)}
                                className="p-3 pb-8 shadow-sm hover:shadow-md cursor-pointer transition-all"
                                style={{
                                  borderLeft: `6px solid ${stream.color}`,
                                  borderRadius: '9px',
                                  background: isSelected ? '#e0f2fe' : noDeadline ? '#fef08a' : '#fff',
                                  opacity: isCompleted ? 0.7 : 1,
                                  outline: isSelected ? '2px solid #0097b2' : noDeadline ? '2px solid #eab308' : undefined,
                                  borderLeftWidth: '6px',
                                  borderLeftColor: stream.color,
                                  position: 'relative',
                                }}
                              >
                                {showBatchDemote && !isCompleted && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleBatchSelect(task.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute top-2 right-2 w-4 h-4 accent-blue-600"
                                  />
                                )}
                                <p style={{ fontFamily: "'Mynerve', cursive", fontSize: '15px', textDecoration: isCompleted ? 'line-through' : 'none' }} className="text-gray-900 mb-1">{displayTitle}</p>
                                <p className="text-xs text-gray-500">{completedCount}/{totalCount} done · {daysUntilDeadline(task.deadline)}</p>
                                {!showBatchDemote && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); isCompleted ? uncompleteTask(task.id) : completeTask(task); }}
                                    title={isCompleted ? 'Reopen task' : 'Mark complete'}
                                    style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px' }}
                                  >
                                    {isCompleted ? '↩️' : '✅'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {colTasks.length === 0 && <p className="text-xs text-gray-400 px-1">No projects</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {currentView === 'hose' && !selectedTask && (
            <div>
              <h2 style={{ fontFamily: "'Ranchers', cursive", fontSize: '24px', color: '#0078a0', marginBottom: '1.5rem' }}>Get the Hose (Gantt)</h2>
              {tasks.length === 0 ? (
                <div className="bg-gray-50 p-8 shadow-md text-center" style={{ borderRadius: '9px' }}><p className="text-gray-600 text-lg">No projects yet.</p></div>
              ) : (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const activeTasks = tasks.filter(t => !t.completed);

                // Gather all relevant dates: project start dates, deadlines, and subtask deadlines
                const allDates = [today];
                activeTasks.forEach(t => {
                  allDates.push(new Date(getStartDate(t)));
                  if (t.deadline) allDates.push(new Date(t.deadline));
                  t.subtasks?.forEach(s => { if (s.deadline) allDates.push(new Date(s.deadline)); });
                });

                let minDate = new Date(Math.min(...allDates));
                let maxDate = new Date(Math.max(...allDates));
                minDate.setDate(minDate.getDate() - 2);
                minDate.setDate(1); // snap to start of month for clean month labels
                maxDate.setDate(maxDate.getDate() + 3);
                // Ensure at least 6 months of view from today, so there's always room to scroll forward
                const sixMonthsOut = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
                if (maxDate < sixMonthsOut) maxDate = sixMonthsOut;
                const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / 86400000));
                const todayOffset = Math.max(0, Math.min(totalDays, Math.floor((today - minDate) / 86400000)));

                // Build month label segments
                const months = [];
                let cursor = new Date(minDate);
                while (cursor < maxDate) {
                  const monthStart = new Date(cursor);
                  const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
                  const segmentEnd = nextMonth < maxDate ? nextMonth : maxDate;
                  const startOffset = Math.max(0, Math.floor((monthStart - minDate) / 86400000));
                  const endOffset = Math.floor((segmentEnd - minDate) / 86400000);
                  months.push({
                    label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    left: (startOffset / totalDays) * 100,
                    width: ((endOffset - startOffset) / totalDays) * 100,
                  });
                  cursor = nextMonth;
                }

                const barStyle = (startDate, endDate, color, progressPct) => {
                  const s = new Date(startDate);
                  const e = endDate ? new Date(endDate) : new Date(s.getTime() + 86400000);
                  const startOffset = Math.max(0, Math.floor((s - minDate) / 86400000));
                  const endOffset = Math.max(startOffset + 1, Math.ceil((e - minDate) / 86400000));
                  const leftPct = (startOffset / totalDays) * 100;
                  const widthPct = ((endOffset - startOffset) / totalDays) * 100;
                  return { leftPct, widthPct, color, progressPct };
                };

                const renderHolidayStripes = () => holidays.map((h, hIdx) => {
                  const hStart = new Date(h.start);
                  const hEnd = new Date(h.end);
                  const hStartOffset = Math.floor((hStart - minDate) / 86400000);
                  const hEndOffset = Math.floor((hEnd - minDate) / 86400000) + 1;
                  if (hEndOffset <= 0 || hStartOffset >= totalDays) return null;
                  const hLeft = Math.max(0, hStartOffset);
                  const hWidth = Math.min(totalDays, hEndOffset) - hLeft;
                  const angle = hIdx % 2 === 0 ? '45deg' : '-45deg';
                  return (
                    <div
                      key={h.id}
                      title={h.label}
                      className="absolute top-0 bottom-0"
                      style={{ left: `${(hLeft / totalDays) * 100}%`, width: `${(hWidth / totalDays) * 100}%`, background: `repeating-linear-gradient(${angle}, #a8aab0, #a8aab0 4px, #93959a 4px, #93959a 8px)`, borderRadius: '4px', zIndex: 0 }}
                    ></div>
                  );
                });

                const dayWidth = 12; // px per day
                const timelineWidth = totalDays * dayWidth;

                return (
                  <div className="bg-gray-50 p-4 shadow-md overflow-x-auto" style={{ borderRadius: '9px' }}>
                    <div style={{ width: `${timelineWidth + 240}px`, minWidth: '100%' }}>
                      {/* Month header row */}
                      <div className="flex">
                        <div className="w-40 flex-shrink-0 sticky left-0 bg-gray-50" style={{ zIndex: 2, borderRadius: '9px' }}></div>
                        <div className="relative flex-1 h-7 mb-1">
                          {months.map((m, i) => (
                            <div
                              key={i}
                              className="absolute top-0 bottom-0 flex items-center justify-end text-xs font-medium text-gray-600 border-l border-gray-300 pr-2"
                              style={{ left: `${m.left}%`, width: `${m.width}%`, background: 'hsla(210,17%,98%,0.85)' }}
                            >
                              {m.label}
                            </div>
                          ))}
                        </div>
                        <div className="w-20 flex-shrink-0"></div>
                      </div>
                      {/* Today marker row */}
                      <div className="flex mb-2">
                        <div className="w-40 flex-shrink-0 sticky left-0 bg-gray-50" style={{ zIndex: 2, borderRadius: '9px' }}></div>
                        <div className="relative flex-1 h-5 border-b border-gray-300">
                          <div className="absolute top-0 bottom-0 w-px bg-red-400" style={{ left: `${(todayOffset / totalDays) * 100}%` }}></div>
                          <span className="absolute text-xs text-red-500 -top-0.5" style={{ left: `${(todayOffset / totalDays) * 100}%`, transform: 'translateX(-50%)' }}>Today</span>
                        </div>
                        <div className="w-20 flex-shrink-0"></div>
                      </div>
                      {holidays.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-500 ml-40">
                          {holidays.map(h => (
                            <span key={h.id} className="flex items-center gap-1">
                              <span className="inline-block w-3 h-3" style={{ background: 'repeating-linear-gradient(45deg, #a8aab0, #a8aab0 4px, #93959a 4px, #93959a 8px)', borderRadius: '2px' }}></span>
                              {h.label}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="space-y-1">
                        {activeTasks.map(task => {
                          const completedCount = task.subtasks?.filter(s => s.completed).length || 0;
                          const totalCount = task.subtasks?.length || 0;
                          const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                          const taskBar = barStyle(getStartDate(task), task.deadline, getStreamColor(task.stream_id), progressPct);
                          const subtasksWithDates = (task.subtasks || [])
                            .filter(s => s.deadline || s.start_date)
                            .sort((a, b) => {
                              if (!a.deadline && !b.deadline) return 0;
                              if (!a.deadline) return 1;
                              if (!b.deadline) return -1;
                              return new Date(a.deadline) - new Date(b.deadline);
                            });
                          return (
                            <div key={task.id}>
                              <div className="flex items-center gap-2 py-0.5">
                                <div className="w-40 flex-shrink-0 truncate text-sm text-gray-700 font-medium sticky left-0 pr-2" style={{ zIndex: 2, borderRadius: '4px', paddingLeft: '4px', background: 'hsla(210,17%,98%,0.65)' }} title={task.title}>{task.title}</div>
                                <div className="relative flex-1 flex items-center" style={{ height: '17px' }}>
                                  <div className="relative w-full" style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
                                  {renderHolidayStripes()}
                                  <div
                                    onClick={() => setSelectedTask(task)}
                                    className="absolute top-0 cursor-pointer flex items-center"
                                    style={{ height: '8px', left: `${taskBar.leftPct}%`, width: `${Math.max(taskBar.widthPct, 2)}%`, background: taskBar.color, borderRadius: '4px', minWidth: '8px', zIndex: 1 }}
                                  >
                                    <div className="absolute left-0 top-0 h-full bg-black bg-opacity-20" style={{ width: `${taskBar.progressPct}%`, borderRadius: '4px 0 0 4px' }}></div>
                                  </div>
                                  </div>
                                </div>
                                <div className="w-20 flex-shrink-0 text-xs text-gray-500">{daysUntilDeadline(task.deadline)}</div>
                              </div>
                              {subtasksWithDates.map(sub => {
                                const subStart = sub.start_date ? sub.start_date.split('T')[0] : getStartDate(task);
                                const subEnd = sub.deadline ? sub.deadline.split('T')[0] : subStart;
                                const subBar = barStyle(subStart, subEnd, '#B5D4F4', sub.completed ? 100 : 0);
                                return (
                                  <div key={sub.id} className="flex items-center gap-2 py-0.5">
                                    <div className="w-40 flex-shrink-0 truncate text-xs text-gray-500 pl-4 sticky left-0 pr-2" style={{ zIndex: 2, borderRadius: '4px', paddingLeft: '4px', background: 'hsla(210,17%,98%,0.65)' }} title={sub.text}>↳ {sub.text}</div>
                                    <div className="relative flex-1 flex items-center" style={{ height: '13px' }}>
                                      <div className="relative w-full" style={{ height: '5px', background: '#f3f4f6', borderRadius: '4px' }}>
                                      {renderHolidayStripes()}
                                      <div
                                        onClick={() => setSelectedTask(task)}
                                        className="absolute top-0 cursor-pointer"
                                        style={{ height: '5px', left: `${subBar.leftPct}%`, width: `${Math.max(subBar.widthPct, 1.5)}%`, background: subBar.color, borderRadius: '4px', minWidth: '6px', zIndex: 1, opacity: sub.completed ? 0.5 : 1 }}
                                      ></div>
                                      </div>
                                    </div>
                                    <div className="w-20 flex-shrink-0 text-xs text-gray-400">{daysUntilDeadline(sub.deadline)}</div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
      {showReward && rewardAnimal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-8 text-center max-w-sm" style={{ borderRadius: '9px' }}>
            <p style={{ fontFamily: "'Ranchers', cursive", fontSize: '32px' }} className="text-blue-600 mb-4">You did it!</p>
            <img src={rewardAnimal.url} alt={rewardAnimal.name} className="w-80 h-64 object-cover mb-4 border-4 border-purple-600" style={{ borderRadius: '9px' }} />
            <p className="text-gray-600 text-lg">A wild {rewardAnimal.name} appears! 🎉</p>
          </div>
        </div>
      )}
    </div>
  );
};
export default WildfireDashboard;
