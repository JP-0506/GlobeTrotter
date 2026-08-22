// TODO: built by Person 2 (Itinerary Builder) — Itinerary Builder & View screen
// GET /api/trips/:id  →  trip details + itinerary
// Add/remove/reorder stops, assign activities to a stop+day
// Depends on: Person 1's trips table, Person 3's CityPicker + ActivityPicker components

import { useParams } from 'react-router-dom';

export default function ItineraryPage() {
  const { id } = useParams();

  return (
    <div className="page-placeholder">
      <h1>Itinerary Builder</h1>
      <p>Trip #{id} — build the itinerary view / editor here.</p>
    </div>
  );
}
