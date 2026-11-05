import {
  ArrowLeft,
  Package,
  Scale,
  FileText,
  ChevronRight,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";

function PackageDetails() {
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();

  return (
    <div className="app">
      {/* HEADER */}
      <header className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/customer/book")}
        >
          <ArrowLeft size={21} />
        </button>

        <div>
          <h1>Package Details</h1>
          <p>Tell us about your parcel</p>
        </div>
      </header>

      <main className="form-page">
        {/* PROGRESS */}
        <div className="booking-progress">
          <div className="progress-step completed">
            <span><Check size={14} aria-hidden="true" /></span>
            <p>Route</p>
          </div>

          <div className="progress-line active"></div>

          <div className="progress-step active">
            <span>2</span>
            <p>Package</p>
          </div>

          <div className="progress-line"></div>

          <div className="progress-step">
            <span>3</span>
            <p>Payment</p>
          </div>
        </div>

        {/* PACKAGE TYPE */}
        <section className="form-card">
          <div className="card-heading">
            <div className="card-heading-icon">
              <Package size={21} />
            </div>

            <div>
              <h2>Package Information</h2>
              <p>Enter basic details about your parcel</p>
            </div>
          </div>

          <label className="field-label">Package Type</label>
          <select
            className="form-select"
            value={booking.packageType}
            onChange={(e) => updateBooking({ packageType: e.target.value })}
          >
            <option value="SMALL_PARCEL">Small Parcel</option>
            <option value="DOCUMENT">Document</option>
            <option value="MEDIUM_PARCEL">Medium Parcel</option>
            <option value="LARGE_PARCEL">Large Parcel</option>
            <option value="FRAGILE_ITEM">Fragile Item</option>
          </select>

          <label className="field-label">Package Description</label>
          <div className="textarea-box">
            <FileText size={20} />
            <textarea
              placeholder="Example: Books, clothes, electronics..."
              rows="4"
              value={booking.packageDescription}
              onChange={(e) => updateBooking({ packageDescription: e.target.value })}
            ></textarea>
          </div>
        </section>

        {/* WEIGHT */}
        <section className="form-card">
          <div className="card-heading">
            <div className="card-heading-icon">
              <Scale size={21} />
            </div>

            <div>
              <h2>Package Weight</h2>
              <p>Approximate weight of your parcel</p>
            </div>
          </div>

          <div className="weight-input">
            <input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="Enter weight"
              value={booking.packageWeightKg}
              onChange={(e) =>
                updateBooking({ packageWeightKg: parseFloat(e.target.value) || 0.5 })
              }
            />
            <span>KG</span>
          </div>

          <div className="weight-options">
            {[0.5, 1, 2, 5].map((w) => (
              <button
                key={w}
                type="button"
                style={{
                  borderColor: booking.packageWeightKg === w ? "#D4030B" : undefined,
                  fontWeight: booking.packageWeightKg === w ? "bold" : "normal",
                }}
                onClick={() => updateBooking({ packageWeightKg: w })}
              >
                {w} KG
              </button>
            ))}
          </div>
        </section>

        {/* SPECIAL INSTRUCTIONS */}
        <section className="form-card">
          <label className="field-label">Special Instructions</label>
          <textarea
            className="large-textarea"
            placeholder="Any special handling instructions?"
            rows="4"
            value={booking.specialInstructions}
            onChange={(e) =>
              updateBooking({ specialInstructions: e.target.value })
            }
          ></textarea>
        </section>

        {/* CONTINUE */}
        <button
          className="continue-btn"
          onClick={() => navigate("/customer/fare")}
        >
          Continue to Fare
          <ChevronRight size={20} />
        </button>
      </main>
    </div>
  );
}

export default PackageDetails;
