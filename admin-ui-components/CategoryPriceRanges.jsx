import React, { useState, useEffect } from 'react';
import './CategoryPriceRanges.css';

const CategoryPriceRanges = ({ categoryId, onClose }) => {
  const [category, setCategory] = useState(null);
  const [priceRanges, setPriceRanges] = useState([]);
  const [scrapingConfig, setScrapingConfig] = useState({
    maxProductsPerRange: 20,
    maxPages: 2,
    scrapingStatus: 'pending'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Default price range template
  const defaultRange = {
    name: '',
    label: '',
    min: 0,
    max: 0,
    query: ''
  };

  useEffect(() => {
    if (categoryId) {
      fetchCategoryPriceRanges();
    }
  }, [categoryId]);

  const fetchCategoryPriceRanges = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/categories/${categoryId}/price-ranges`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch price ranges');
      }

      const data = await response.json();
      if (data.success) {
        setCategory({
          id: data.data.categoryId,
          name: data.data.categoryName,
          title: data.data.categoryTitle
        });
        setPriceRanges(data.data.priceRanges || []);
        setScrapingConfig(data.data.scrapingConfig || scrapingConfig);
      }
    } catch (err) {
      setError('Error loading price ranges: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceRangeChange = (index, field, value) => {
    const updatedRanges = [...priceRanges];
    updatedRanges[index] = {
      ...updatedRanges[index],
      [field]: field === 'min' || field === 'max' ? Number(value) : value
    };
    setPriceRanges(updatedRanges);
  };

  const addPriceRange = () => {
    setPriceRanges([...priceRanges, { ...defaultRange }]);
  };

  const removePriceRange = (index) => {
    const updatedRanges = priceRanges.filter((_, i) => i !== index);
    setPriceRanges(updatedRanges);
  };

  const handleScrapingConfigChange = (field, value) => {
    setScrapingConfig({
      ...scrapingConfig,
      [field]: field === 'maxProductsPerRange' || field === 'maxPages' ? Number(value) : value
    });
  };

  const savePriceRanges = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validate ranges
      for (let i = 0; i < priceRanges.length; i++) {
        const range = priceRanges[i];
        if (!range.name || !range.label || range.min < 0 || range.max <= range.min) {
          throw new Error(`Invalid data in price range ${i + 1}`);
        }
      }

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/categories/${categoryId}/price-ranges`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceRanges,
          scrapingConfig
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save price ranges');
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Price ranges saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error saving price ranges: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    if (!confirm('Reset to default price ranges? This will overwrite current ranges.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/categories/${categoryId}/price-ranges/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reset price ranges');
      }

      const data = await response.json();
      if (data.success) {
        setPriceRanges(data.data.priceRanges);
        setScrapingConfig(data.data.scrapingConfig);
        setSuccess('Price ranges reset to default successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error resetting price ranges: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="price-ranges-modal">
        <div className="price-ranges-content">
          <div className="loading">Loading price ranges...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="price-ranges-modal">
      <div className="price-ranges-content">
        <div className="modal-header">
          <h2>Price Range Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {category && (
          <div className="category-info">
            <h3>{category.title} ({category.name})</h3>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="price-ranges-section">
          <div className="section-header">
            <h4>Price Ranges</h4>
            <div className="action-buttons">
              <button 
                className="btn btn-secondary" 
                onClick={addPriceRange}
                disabled={saving}
              >
                Add Range
              </button>
              <button 
                className="btn btn-warning" 
                onClick={resetToDefault}
                disabled={saving}
              >
                Reset to Default
              </button>
            </div>
          </div>

          <div className="price-ranges-list">
            {priceRanges.map((range, index) => (
              <div key={index} className="price-range-item">
                <div className="range-fields">
                  <div className="field-group">
                    <label>Name:</label>
                    <input
                      type="text"
                      placeholder="e.g., under_10k"
                      value={range.name}
                      onChange={(e) => handlePriceRangeChange(index, 'name', e.target.value)}
                    />
                  </div>
                  
                  <div className="field-group">
                    <label>Label:</label>
                    <input
                      type="text"
                      placeholder="e.g., ₹5,000 - ₹10,000"
                      value={range.label}
                      onChange={(e) => handlePriceRangeChange(index, 'label', e.target.value)}
                    />
                  </div>
                  
                  <div className="field-group">
                    <label>Min Price:</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={range.min}
                      onChange={(e) => handlePriceRangeChange(index, 'min', e.target.value)}
                    />
                  </div>
                  
                  <div className="field-group">
                    <label>Max Price:</label>
                    <input
                      type="number"
                      placeholder="10000"
                      min="0"
                      value={range.max}
                      onChange={(e) => handlePriceRangeChange(index, 'max', e.target.value)}
                    />
                  </div>
                  
                  <div className="field-group">
                    <label>Query:</label>
                    <input
                      type="text"
                      placeholder="e.g., under 10000"
                      value={range.query}
                      onChange={(e) => handlePriceRangeChange(index, 'query', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="range-preview">
                  <span>Preview: {formatCurrency(range.min)} - {formatCurrency(range.max)}</span>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => removePriceRange(index)}
                    disabled={saving}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="scraping-config-section">
          <h4>Scraping Configuration</h4>
          <div className="config-fields">
            <div className="field-group">
              <label>Max Products Per Range:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={scrapingConfig.maxProductsPerRange}
                onChange={(e) => handleScrapingConfigChange('maxProductsPerRange', e.target.value)}
              />
            </div>
            
            <div className="field-group">
              <label>Max Pages:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={scrapingConfig.maxPages}
                onChange={(e) => handleScrapingConfigChange('maxPages', e.target.value)}
              />
            </div>
            
            <div className="field-group">
              <label>Scraping Status:</label>
              <select
                value={scrapingConfig.scrapingStatus}
                onChange={(e) => handleScrapingConfigChange('scrapingStatus', e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={savePriceRanges}
            disabled={saving || priceRanges.length === 0}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryPriceRanges;
