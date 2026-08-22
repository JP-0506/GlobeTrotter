// TODO: built by Person 4 (Budget) — Budget & Cost Breakdown screen
// GET /api/trips/:id/budget  →  cost data
// Budget total + category breakdown (table or simple chart)
// Depends on: Person 2's trip_stops/trip_activities (costs roll up from activities)

import { useParams } from 'react-router-dom';

export default function BudgetPage() {
  const { id } = useParams();

  return (
    <div className="page-placeholder">
      <h1>Budget &amp; Cost Breakdown</h1>
      <p>Trip #{id} — build the budget tracker here.</p>
    </div>
  );
}
