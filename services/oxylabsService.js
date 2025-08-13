const axios = require('axios');
require('dotenv').config();

class OxylabsService {
  constructor() {
    this.config = {
      username: process.env.OXYLABS_USERNAME || 'idevendra_T8Kdf',
      password: process.env.OXYLABS_PASSWORD || 'Sy4Y9Kh3+wNDrR=',
      endpoint: process.env.OXYLABS_ENDPOINT || 'realtime.oxylabs.io'
    };
    this.baseURL = `https://${this.config.endpoint}/v1/queries`;
  }

  /**
   * Make API request to Oxylabs
   * @param {Object} payload - Request payload
   * @returns {Promise<Object>} - API response
   */
  async makeRequest(payload) {
    try {
      console.log(`📡 Making Oxylabs request for: ${payload.query || payload.url}`);
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(this.baseURL, payload, {
        auth: {
          username: this.config.username,
          password: this.config.password
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrustfolioBot/1.0'
        },
        timeout: 120000 // 120 seconds timeout
      });

      console.log('✅ Oxylabs Response Status:', response.status);
      console.log('📊 Response Data Keys:', Object.keys(response.data));

      if (response.data && response.data.results && response.data.results.length > 0) {
        console.log('🎯 Found results:', response.data.results.length);
        return response.data.results[0];
      } else {
        console.error('❌ No results in response:', response.data);
        throw new Error('No results found in Oxylabs response');
      }
    } catch (error) {
      console.error('❌ Oxylabs API Error:', error.message);
      if (error.response) {
        console.error('❌ Response Status:', error.response.status);
        console.error('❌ Response Headers:', error.response.headers);
        console.error('❌ Response Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('❌ Request Error:', error.request);
      }
      throw error;
    }
  }

  /**
   * Search Amazon products by category and price range
   * @param {string} category - Category name
   * @param {number} maxPrice - Maximum price filter
   * @param {Array} keywords - Additional search keywords
   * @param {number} limit - Number of products to fetch
   * @returns {Promise<Array>} - Array of products
   */
  async searchProducts(category, maxPrice, keywords = [], limit = 20) {
    // Optimize search query for better results
    const searchTerms = [category, ...keywords].join(' ');
    
    const payload = {
      source: 'amazon_search',
      query: searchTerms,
      parse: true,
      user_agent_type: 'desktop',
      context: [
        {
          key: 'results_language',
          value: 'en'
        }
      ]
    };

    // Note: Using amazon_search source with context for better results
    // Price filtering will be done client-side after getting results

    try {
      const result = await this.makeRequest(payload);
      
      console.log('🔍 Full result structure:', JSON.stringify(result, null, 2));
      
      if (result.content && result.content.results && result.content.results.organic) {
        const products = result.content.results.organic.slice(0, limit);
        console.log(`✅ Found ${products.length} products for ${category} under ₹${maxPrice}`);
        return products;
      } else if (result.content && result.content.results) {
        console.log('📊 Available result types:', Object.keys(result.content.results));
        // Try to get products from any available results
        const allResults = result.content.results.organic || 
                          result.content.results.paid || 
                          result.content.results.sponsored || 
                          [];
        const products = allResults.slice(0, limit);
        console.log(`✅ Found ${products.length} alternative products for ${category}`);
        return products;
      } else {
        console.warn(`⚠️  No organic results found for ${category} under ₹${maxPrice}`);
        console.log('Available content keys:', result.content ? Object.keys(result.content) : 'No content');
        return [];
      }
    } catch (error) {
      console.error(`❌ Failed to search products for ${category}:`, error.message);
      return [];
    }
  }

  /**
   * Get detailed product information by ASIN
   * @param {string} asin - Amazon ASIN
   * @returns {Promise<Object>} - Detailed product information
   */
  async getProductDetails(asin) {
    const payload = {
      source: 'amazon_product',
      // Note: domain parameter removed - not available in this subscription
      query: asin,
      parse: true
    };

    try {
      const result = await this.makeRequest(payload);
      
      if (result.content) {
        console.log(`✅ Got detailed info for ASIN: ${asin}`);
        return result.content;
      } else {
        throw new Error(`No product details found for ASIN: ${asin}`);
      }
    } catch (error) {
      console.error(`❌ Failed to get details for ASIN ${asin}:`, error.message);
      throw error;
    }
  }

  /**
   * Parse and structure product data from Oxylabs response
   * @param {Object} rawProduct - Raw product data from Oxylabs
   * @param {Object} category - Category information
   * @param {Object} searchInfo - Search metadata
   * @returns {Object} - Structured product data
   */
  parseProductData(rawProduct, category, searchInfo = {}) {
    try {
      // Extract basic information
      const title = this.extractTitle(rawProduct);
      const price = this.extractPrice(rawProduct);
      const rating = this.extractRating(rawProduct);
      const images = this.extractImages(rawProduct);
      const asin = this.extractASIN(rawProduct);
      const brand = this.extractBrand(rawProduct);
      const availability = this.extractAvailability(rawProduct);

      if (!title || !price || !asin) {
        console.warn('⚠️  Missing critical product data:', { title: !!title, price: !!price, asin: !!asin });
        return null;
      }

      // Structure the product data
      const productData = {
        asin: asin,
        title: title,
        brand: brand,
        category: category._id,
        categoryName: category.name,
        
        pricing: {
          current: price.current,
          original: price.original || price.current,
          discount: price.discount || {},
          currency: 'INR'
        },
        
        url: rawProduct.url || `https://www.amazon.in/dp/${asin}`,
        images: images,
        primaryImage: images.length > 0 ? images[0].url : null,
        
        description: {
          short: rawProduct.title || title,
          bullets: rawProduct.feature_bullets || []
        },
        
        rating: {
          average: rating.average || 0,
          totalReviews: rating.totalReviews || 0
        },
        
        availability: {
          status: availability.status || 'unknown',
          deliveryInfo: availability.deliveryInfo
        },
        
        scrapingInfo: {
          scrapedAt: new Date(),
          source: 'oxylabs',
          searchQuery: searchInfo.query,
          priceRangeQueried: searchInfo.priceRange || {},
          position: searchInfo.position || 0
        },
        
        isActive: true,
        quality: this.assessProductQuality(rawProduct, rating)
      };

      return productData;
    } catch (error) {
      console.error('❌ Error parsing product data:', error.message);
      return null;
    }
  }

  /**
   * Extract product title
   */
  extractTitle(product) {
    return product.title || product.name || null;
  }

  /**
   * Extract pricing information
   */
  extractPrice(product) {
    let current = null;
    let original = null;
    
    // Try different price field variations
    if (product.price) {
      if (typeof product.price === 'number') {
        current = product.price;
      } else if (product.price.current) {
        current = product.price.current;
        original = product.price.original;
      } else if (product.price.value) {
        current = product.price.value;
      }
    } else if (product.price_upper) {
      current = product.price_upper;
    } else if (product.price_lower) {
      current = product.price_lower;
    }

    // Parse string prices (handle both USD and INR formats)
    if (typeof current === 'string') {
      // Remove currency symbols and convert to number
      current = parseFloat(current.replace(/[^0-9.]/g, ''));
    }
    if (typeof original === 'string') {
      original = parseFloat(original.replace(/[^0-9.]/g, ''));
    }
    
    // Smart currency detection and conversion
    // If price is likely in USD (< 1000), convert to approximate INR
    if (current && current < 1000 && current > 0) {
      console.log(`💱 Converting USD ${current} to INR`);
      current = Math.round(current * 83); // Approximate USD to INR conversion
    }
    if (original && original < 1000 && original > 0) {
      console.log(`💱 Converting original USD ${original} to INR`);
      original = Math.round(original * 83);
    }

    const discount = {};
    if (current && original && original > current) {
      discount.amount = original - current;
      discount.percentage = Math.round(((original - current) / original) * 100);
    }

    return {
      current,
      original,
      discount
    };
  }

  /**
   * Extract rating information
   */
  extractRating(product) {
    let average = 0;
    let totalReviews = 0;

    if (product.rating) {
      if (typeof product.rating === 'number') {
        average = product.rating;
      } else if (product.rating.rating) {
        average = product.rating.rating;
        totalReviews = product.rating.reviews_count || 0;
      }
    }

    // Try alternative fields
    if (product.reviews_count) {
      totalReviews = product.reviews_count;
    }

    return {
      average: parseFloat(average) || 0,
      totalReviews: parseInt(totalReviews) || 0
    };
  }

  /**
   * Extract product images
   */
  extractImages(product) {
    const images = [];
    
    // Try multiple image field variations
    const imageFields = [
      'images', 'image', 'url_image', 'thumbnail', 'img_url', 
      'main_image', 'product_image', 'picture'
    ];
    
    for (const field of imageFields) {
      if (product[field]) {
        if (Array.isArray(product[field])) {
          product[field].forEach((img, index) => {
            let imageUrl = null;
            
            if (typeof img === 'string') {
              imageUrl = img;
            } else if (typeof img === 'object' && img.url) {
              imageUrl = img.url;
            }
            
            if (imageUrl && imageUrl.startsWith('http')) {
              images.push({
                url: imageUrl,
                alt: product.title || 'Product image',
                isPrimary: index === 0 && images.length === 0
              });
            }
          });
        } else if (typeof product[field] === 'string' && product[field].startsWith('http')) {
          images.push({
            url: product[field],
            alt: product.title || 'Product image',
            isPrimary: images.length === 0
          });
        }
        
        // If we found images from this field, stop looking
        if (images.length > 0) break;
      }
    }
    
    // If no images found, create a placeholder based on category
    if (images.length === 0) {
      console.warn('⚠️  No images found, using placeholder');
      // Don't add placeholder - let validation handle this
    }

    return images;
  }

  /**
   * Extract ASIN from product data
   */
  extractASIN(product) {
    if (product.asin) {
      return product.asin;
    }
    
    // Try to extract from URL
    if (product.url) {
      const asinMatch = product.url.match(/\/dp\/([A-Z0-9]{10})/);
      if (asinMatch) {
        return asinMatch[1];
      }
    }
    
    return null;
  }

  /**
   * Extract brand information
   */
  extractBrand(product) {
    return product.brand || product.manufacturer || null;
  }

  /**
   * Extract availability information
   */
  extractAvailability(product) {
    let status = 'unknown';
    let deliveryInfo = null;

    if (product.availability) {
      if (typeof product.availability === 'string') {
        if (product.availability.toLowerCase().includes('in stock')) {
          status = 'in_stock';
        } else if (product.availability.toLowerCase().includes('out of stock')) {
          status = 'out_of_stock';
        }
        deliveryInfo = product.availability;
      }
    }

    if (product.delivery) {
      deliveryInfo = product.delivery;
    }

    return {
      status,
      deliveryInfo
    };
  }

  /**
   * Assess product quality based on available data
   */
  assessProductQuality(product, rating) {
    let score = 0;
    
    // Rating score (40% weight)
    if (rating.average >= 4.0 && rating.totalReviews >= 100) {
      score += 40;
    } else if (rating.average >= 3.5 && rating.totalReviews >= 50) {
      score += 30;
    } else if (rating.average >= 3.0) {
      score += 20;
    }
    
    // Image quality (20% weight)
    if (product.images && product.images.length >= 3) {
      score += 20;
    } else if (product.images && product.images.length >= 1) {
      score += 15;
    }
    
    // Title quality (20% weight)
    if (product.title && product.title.length >= 50) {
      score += 20;
    } else if (product.title && product.title.length >= 20) {
      score += 15;
    }
    
    // Brand presence (10% weight)
    if (product.brand) {
      score += 10;
    }
    
    // Features/bullets (10% weight)
    if (product.feature_bullets && product.feature_bullets.length > 0) {
      score += 10;
    }
    
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}

module.exports = new OxylabsService();
