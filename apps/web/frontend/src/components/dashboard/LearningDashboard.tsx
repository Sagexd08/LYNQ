import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './LearningDashboard.css';

interface Module {
  id: string;
  title: string;
  description: string;
  category: 'Beginner' | 'Intermediate' | 'Advanced';
  difficulty: number;
  estimatedTime: number;
  points: number;
  progress?: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export const LearningDashboard: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    level: 1,
    streak: 0,
    lessonsCompleted: 0
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [modulesRes, badgesRes, statsRes] = await Promise.all([
        fetch('/api/learning/modules'),
        fetch('/api/learning/badges'),
        fetch('/api/learning/stats')
      ]);

      const modulesData = await modulesRes.json();
      const badgesData = await badgesRes.json();
      const statsData = await statsRes.json();

      setModules(modulesData.data.modules);
      setBadges(badgesData.data.badges);
      setUserStats(statsData.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = selectedCategory === 'All'
    ? modules
    : modules.filter(m => m.category === selectedCategory);

  const categoryColors: Record<string, string> = {
    'Beginner': '#10b981',
    'Intermediate': '#f59e0b',
    'Advanced': '#ef4444'
  };

  const getDifficultyStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  return (
    <div className="learning-dashboard">
      <motion.div
        className="learning-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Learning Hub</h1>
        <p>Expand your knowledge and earn rewards</p>
      </motion.div>

      {/* User Stats Cards */}
      <motion.div
        className="stats-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{userStats.totalPoints}</div>
            <div className="stat-label">Total Points</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">Level {userStats.level}</div>
            <div className="stat-label">Current Level</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{userStats.streak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-value">{userStats.lessonsCompleted}</div>
            <div className="stat-label">Lessons Done</div>
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <div className="category-filter">
        {['All', 'Beginner', 'Intermediate', 'Advanced'].map(cat => (
          <button
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="modules-section">
        <h2>Available Modules</h2>
        {loading ? (
          <div className="loading">Loading modules...</div>
        ) : (
          <div className="modules-grid">
            {filteredModules.map((module, index) => (
              <motion.div
                key={module.id}
                className="module-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div
                  className="module-header"
                  style={{ borderTopColor: categoryColors[module.category] }}
                >
                  <span className="category-badge">{module.category}</span>
                  <span className="points-badge">{module.points} pts</span>
                </div>

                <div className="module-body">
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>

                  <div className="module-meta">
                    <div className="meta-item">
                      <span>⏱️</span>
                      <span>{module.estimatedTime} min</span>
                    </div>
                    <div className="meta-item">
                      <span>📊</span>
                      <span>{getDifficultyStars(module.difficulty)}</span>
                    </div>
                  </div>

                  {module.progress !== undefined && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${module.progress}%` }}
                      />
                      <span className="progress-text">{module.progress}%</span>
                    </div>
                  )}
                </div>

                <div className="module-footer">
                  <button className="btn-start">
                    {module.progress === 100 ? 'Review' : 'Continue'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Badges Section */}
      <div className="badges-section">
        <h2>Badges & Achievements</h2>
        <div className="badges-grid">
          {badges.slice(0, 6).map((badge, index) => (
            <motion.div
              key={badge.id}
              className="badge-card"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1 }}
            >
              <div className="badge-icon">{badge.icon}</div>
              <h4>{badge.name}</h4>
              <p>{badge.description}</p>
              <span className="badge-category">{badge.category}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recommended Section */}
      <div className="recommended-section">
        <h2>Recommended For You</h2>
        <p className="recommended-subtitle">Based on your progress and interests</p>
        <div className="recommended-list">
          {filteredModules.slice(0, 3).map(module => (
            <div key={module.id} className="recommended-item">
              <div className="recommended-info">
                <h4>{module.title}</h4>
                <p>{module.description}</p>
              </div>
              <button className="btn-start-recommended">Start Now</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningDashboard;
