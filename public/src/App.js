import React, { useState, useEffect } from 'react';

// Load fonts
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Ranchers&family=Indie+Flower&family=Baloo+2:wght@400;500;600;700&display=swap');
  
  * {
    font-family: 'Baloo 2', sans-serif;
  }
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
  const [items, setItems] = useState([]);

  // Supabase config
  const SUPABASE_URL = 'https://mrmjzthkzikgzumhxeig.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9KN8kzjDwjbZN41zuVBgfA_snMIEjnH';

  const animals = [
    { name: 'raccoon', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop' },
    { name: 'stoat', url: 'https://images.unsplash.com/photo-1567270671170-fdc10a5bf831?w=500&h=500&fit=crop' },
    { name: 'tarsier', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&h=500&fit=crop' },
    { name: 'sugar glider', url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=500&fit=crop' },
    { name: 'highland cow', url: 'https://images.unsplash.com/photo-1564523072006-0f64ef1c09de?w=500&h=500&fit=crop' },
    { name: 'pika', url: 'https://images.unsplash.com/photo-1486231143907-94eec5f81bb6?w=500&h=500&fit=crop' },
    { name: 'fennec fox', url: 'https://images.unsplash.com/photo-1605559424843-9e4c3ca4b771?w=500&h=500&fit=crop' },
    { name: 'koala', url: 'https://images.unsplash.com/photo-1459751707576-f2a52dfb8ba5?w=500&h=500&fit=crop' },
    { name: 'aye aye', url: 'https://images.unsplash.com/photo-1496854496397-b6a895a09252?w=500&h=500&fit=crop' },
    { name: 'teacup pig', url: 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=500&h=500&fit=crop' },
  ];

  // Fetch from Supabase REST API
  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/projects?select=*,subtasks(*)&order=deadline.asc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const data = await response.json();
      setTasks(data || []);

      // Fetch time entries
      const entriesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/time_entries`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const entries = await entriesResponse.json();
      const entriesByProject = {};
      entries?.forEach(entry => {
        if (!entriesByProject[entry.project_id]) {
          entriesByProject[entry.project_id] = [];
        }
        entriesByProject[entry.project_id].push(entry);
      });
      setTimeEntries(entriesByProject);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const toggleSubtask = async (projectId, subtaskId) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/subtasks?id=eq.${subtaskId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ completed: true })
        }
      );

      if (response.ok) {
        const animal = animals[Math.floor(Math.random() * animals.length)];
        setRewardAnimal(animal);
        setShowReward(true);
        setTimeout(() => setShowReward(false), 3000);
        fetchProjects();
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
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

  const getTopThreeTasks = () => {
    return tasks.slice(0, 3);
  };

  const getStreamColor = (streamId) => {
    const colors = {
      1: '#378ADD', // SBAC
      2: '#BA7517', // NEF
      3: '#378ADD', // Curriculum
      4: '#639922', // Editing
      5: '#EF8936'  // Consulting
    };
    return colors[streamId] || '#378ADD';
  };

  const startTimer = () => {
    setTimerActive(true);
  };

  const stopTimer = async () => {
    setTimerActive(false);
    if (timerSeconds > 0 && selectedTask) {
      const hours = parseFloat((timerSeconds / 3600).toFixed(2));
      
      try {
        await fetch(
          `${SUPABASE_URL}/rest/v1/time_entries`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              project_id: selectedTask.id,
              hours: hours,
              entry_date: new Date().toISOString().split('T')[0],
              notes: ''
            })
          }
        );

        setTimerSeconds(0);
        fetchProjects();
      } catch (error) {
        console.error('Error logging time:', error);
      }
    }
  };

  const parseItems = () => {
    const textarea = document.getElementById('bulkPaste');
    const text = textarea.value;
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const parsed = lines.map(line => ({
      title: line.replace(/^[•\-\*]\s*/, '').trim(),
      deadline: null,
      notes: ''
    }));
    setItems(parsed);
    document.getElementById('itemsPreview').style.display = 'block';
    document.getElementById('submitBtn').style.display = 'block';
  };

  const submitBulkItems = async () => {
    const stream = document.getElementById('stream').value;
    const assignType = document.querySelector('input[name="assignType"]:checked').value;
    const parentProjectId = assignType === 'subtask' ? document.getElementById('parentProject').value : null;

    for (const item of items) {
      try {
        if (assignType === 'project') {
          // Create as new project
          await fetch(
            `${SUPABASE_URL}/rest/v1/projects`,
            {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                title: item.title,
                stream_id: parseInt(stream),
                deadline: item.deadline || null,
                estimated_hours: 0
              })
            }
          );
        } else {
          // Create as subtask
          await fetch(
            `${SUPABASE_URL}/rest/v1/subtasks`,
            {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                project_id: parseInt(parentProjectId),
                text: item.title,
                deadline: item.deadline || null,
                completed: false
              })
            }
          );
        }
      } catch (error) {
        console.error('Error creating item:', error);
      }
    }

    // Reset form and refresh
    document.getElementById('bulkPaste').value = '';
    setItems([]);
    document.getElementById('itemsPreview').style.display = 'none';
    document.getElementById('submitBtn').style.display = 'none';
    fetchProjects();
  };

  useEffect(() => {
    // Toggle parent project selector
    const radios = document.querySelectorAll('input[name="assignType"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const div = document.getElementById('parentProjectDiv');
        div.style.display = e.target.value === 'subtask' ? 'block' : 'none';
      });
    });
  }, [currentView]);

  const TaskCard = ({ task }) => {
    const completedCount = task.subtasks?.filter(s => s.completed).length || 0;
    const totalCount = task.subtasks?.length || 0;
    
    return (
      <div 
        className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer" 
        onClick={() => setSelectedTask(task)}
        style={{ borderLeft: `10px solid ${getStreamColor(task.stream_id)}`, boxShadow: `-6px 0 0 0 rgba(255, 255, 255, 0.8), 0 2px 8px rgba(0, 0, 0, 0.08)` }}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '18px' }} className="text-gray-900 flex-1">
            {task.title}
          </h3>
          <span className={`text-xs font-semibold text-white px-3 py-1 rounded-lg ml-2 whitespace-nowrap ${getDeadlineColor(task.deadline)}`}>
            {daysUntilDeadline(task.deadline)}
          </span>
        </div>
        
        <p className="text-xs text-gray-600 mb-2">{task.estimated_hours || 0}h estimated</p>
        
        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mb-2">
          <div className="h-full" style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%', background: 'linear-gradient(90deg, #975ab6, #ffa3a5)' }}></div>
        </div>
        
        <p className="text-xs text-gray-600">{completedCount} of {totalCount} subtasks done</p>
      </div>
    );
  };

  const navButtons = [
    { id: 'fire', label: 'Fire In The Hole', icon: '🔥' },
    { id: 'log', label: 'Add a log', icon: '⊕' },
    { id: 'smoke', label: "Where There's Smoke", icon: '📅' },
    { id: 'hose', label: 'Get the Hose', icon: '▦' },
    { id: 'sanity', label: 'Sanity', icon: '🧠' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0097b2 0%, #0078a0 100%)' }}>
        <p className="text-white text-2xl">Loading your Wildfire dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0e8f8 100%)' }}>
      <div style={{ background: 'linear-gradient(135deg, #0097b2 0%, #0078a0 100%)' }} className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 style={{ fontFamily: "'Ranchers'", fontSize: '48px', letterSpacing: '2px' }} className="text-white mb-4">
              Wildfire
            </h1>
            
            {/* Nav Buttons */}
            <div className="flex flex-wrap gap-2">
              {navButtons.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setCurrentView(btn.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-2 ${
                    currentView === btn.id
                      ? 'bg-white text-blue-600 border-white shadow-lg'
                      : 'bg-white text-blue-600 border-white hover:shadow-md'
                  }`}
                >
                  <span>{btn.icon}</span>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fire In The Hole View */}
          {currentView === 'fire' && !selectedTask && (
            <div>
              <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '24px', color: 'white', marginBottom: '1.5rem' }}>Your top 3 • Focus on these today</h2>
              <div className="space-y-3">
                {getTopThreeTasks().map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Task Detail with Timer */}
          {selectedTask && (
            <div className="mb-6">
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-white mb-4 hover:underline text-sm"
              >
                ← Back to view
              </button>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h2 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '28px' }} className="text-gray-900 mb-4">
                  {selectedTask.title}
                </h2>
                
                <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Estimated Hours</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedTask.estimated_hours || 0}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Hours Logged</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(timeEntries[selectedTask.id] || []).reduce((sum, e) => sum + parseFloat(e.hours), 0).toFixed(1)}h
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {Math.max(0, (selectedTask.estimated_hours || 0) - (timeEntries[selectedTask.id] || []).reduce((sum, e) => sum + parseFloat(e.hours), 0)).toFixed(1)}h
                    </p>
                  </div>
                </div>

                {/* Timer */}
                <div className="mb-6 pb-6 border-b">
                  <h3 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '18px', marginBottom: '1rem' }} className="text-gray-900">Time tracker</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg text-center">
                    <p className="text-5xl font-bold text-blue-600 font-mono mb-4">
                      {formatTime(timerSeconds)}
                    </p>
                    <div className="flex gap-3 justify-center">
                      {!timerActive ? (
                        <button 
                          onClick={startTimer}
                          className="px-8 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-all text-lg"
                        >
                          ▶ Start
                        </button>
                      ) : (
                        <button 
                          onClick={stopTimer}
                          className="px-8 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all text-lg"
                        >
                          ⏹ Stop
                        </button>
                      )}
                      <button 
                        onClick={() => setTimerSeconds(0)}
                        className="px-8 py-3 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition-all text-lg"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtasks */}
                <div>
                  <h3 style={{ fontFamily: "'Indie Flower', cursive", fontSize: '18px', marginBottom: '0.75rem' }} className="text-gray-900">Subtasks</h3>
                  <div className="space-y-2">
                    {selectedTask.subtasks?.map(subtask => (
                      <label key={subtask.id} className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtask(selectedTask.id, subtask.id)}
                          className="w-4 h-4 accent-purple-600 flex-shrink-0"
                        />
                        <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {subtask.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other views placeholder */}
          {currentView !== 'fire' && !selectedTask && (
            <div className="bg-white rounded-xl p-8 shadow-md text-center">
              <p className="text-gray-600 text-lg">Coming soon! We're building out more views...</p>
            </div>
          )}
        </div>
      </div>

      {/* Reward Modal */}
      {showReward && rewardAnimal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow-2xl">
            <p style={{ fontFamily: "'Ranchers', cursive", fontSize: '32px' }} className="text-blue-600 mb-4">You did it!</p>
            <img 
              src={rewardAnimal.url} 
              alt={rewardAnimal.name}
              className="w-80 h-64 object-cover rounded-xl mb-4 border-4 border-purple-600"
            />
            <p className="text-gray-600 text-lg">A wild {rewardAnimal.name} appears! 🎉</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WildfireDashboard;
