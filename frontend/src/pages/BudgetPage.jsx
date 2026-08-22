import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { Button, Card, Input, LoadingSpinner, EmptyState } from '../components';
import './BudgetPage.css';

export default function BudgetPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for adding custom expenses
  const [adding, setAdding] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'other',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/trips/${id}/budget`);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [id]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      setAdding(true);
      await api.post(`/budget-items`, {
        trip: id,
        ...expenseForm,
      });
      setExpenseForm({
        category: 'other',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
      });
      // Refresh data
      await fetchBudget();
    } catch (err) {
      alert(err.message || 'Failed to add expense');
    } finally {
      setAdding(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (!data) return null;

  return (
    <div className="budget-page">
      <div className="budget-header">
        <div className="budget-title">
          <h1>Budget Breakdown</h1>
          <p>{data.trip_name}</p>
        </div>
        <Link to={`/trips/${id}`}>
          <Button variant="secondary">Back to Itinerary</Button>
        </Link>
      </div>

      <div className="budget-overview-card">
        <div className="stat-box">
          <span className="stat-label">Budget Limit</span>
          <span className="stat-value">${data.budget_limit}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Spent</span>
          <span className={`stat-value ${data.is_over_budget ? 'over-budget' : ''}`}>
            ${data.total_actual_spent.toFixed(2)}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Remaining</span>
          <span className={`stat-value ${data.is_over_budget ? 'over-budget' : ''}`}>
            ${data.remaining_budget.toFixed(2)}
          </span>
        </div>

        {data.budget_limit > 0 && (
          <div className="budget-progress-container">
            <div className="budget-progress-bar">
              <div 
                className={`budget-progress-fill ${data.is_over_budget ? 'over-budget' : ''}`}
                style={{ width: `${Math.min(data.budget_used_percentage, 100)}%` }}
              ></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              <span>{data.budget_used_percentage}% Used</span>
              {data.is_over_budget && <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Over Budget!</span>}
            </div>
          </div>
        )}
      </div>

      <div className="budget-content-grid">
        <div className="left-column">
          <Card className="add-expense-card" style={{ marginBottom: '32px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.125rem' }}>Category Breakdown</h2>
            <div className="category-list">
              {Object.entries(data.category_breakdown).map(([key, cat]) => {
                const total = data.total_actual_spent || 1; // avoid divide by 0
                const percent = (cat.spent / total) * 100;
                return (
                  <div className="category-item" key={key}>
                    <div className="category-header">
                      <span>{cat.label}</span>
                      <span>${cat.spent.toFixed(2)}</span>
                    </div>
                    <div className="category-bar-bg">
                      <div className="category-bar-fill" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="add-expense-card">
            <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.125rem' }}>Log New Expense</h2>
            <form onSubmit={handleAddExpense} className="add-expense-form">
              <div className="input-group form-full-width">
                <label className="input-group__label">Category</label>
                <select 
                  className="input-group__input" 
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                  required
                >
                  <option value="transport">Transport</option>
                  <option value="stay">Stay / Accommodation</option>
                  <option value="activities">Activities</option>
                  <option value="meals">Meals & Dining</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Input 
                label="Date" 
                type="date" 
                value={expenseForm.expense_date}
                onChange={e => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                required
              />
              <Input 
                label="Amount ($)" 
                type="number" 
                step="0.01"
                min="0"
                value={expenseForm.amount}
                onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                required
              />
              <div className="form-full-width">
                <Input 
                  label="Description" 
                  placeholder="e.g. Train ticket to Paris"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="expense-form-actions">
                <Button type="submit" disabled={adding}>
                  {adding ? 'Adding...' : 'Add Expense'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="right-column">
          <div className="details-section">
            <h2>Scheduled Activities</h2>
            {data.scheduled_activities.length === 0 ? (
              <EmptyState message="No scheduled activities yet." />
            ) : (
              <div className="expense-list">
                {data.scheduled_activities.map(act => (
                  <div className="expense-item" key={act.trip_activity_id}>
                    <div className="expense-info">
                      <span className="expense-name">{act.activity_name}</span>
                      <span className="expense-meta">{act.stop_city} • {act.scheduled_date}</span>
                    </div>
                    <span className="expense-amount">${act.effective_cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="details-section" style={{ marginTop: '48px' }}>
            <h2>Other Logged Expenses</h2>
            {data.budget_items.length === 0 ? (
              <EmptyState message="No additional expenses logged." />
            ) : (
              <div className="expense-list">
                {data.budget_items.map(item => (
                  <div className="expense-item" key={item.budget_item_id}>
                    <div className="expense-info">
                      <span className="expense-name">{item.description}</span>
                      <span className="expense-meta">
                        {data.category_breakdown[item.category]?.label || item.category} 
                        {item.expense_date && ` • ${item.expense_date}`}
                      </span>
                    </div>
                    <span className="expense-amount">${parseFloat(item.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
