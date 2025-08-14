const axios = require('axios');
require('dotenv').config();

class ScrapingDogService {
  constructor() {
    this.apiKey = '689c8109805081418fca0f52';
    this.baseURL = 'https://api.scrapingdog.com/amazon/search';
    
    // Price ranges for different budget categories
    this.priceRanges = [
      { name: 'under_5k', query: 'under 5000', max: 5000, min: 0 },
      { name: 'under_10k', query: 'under 10000', max: 10000, min: 5000 },
      { name: 'under_15k', query: 'under 15000', max: 15000, min: 10000 },
      { name: 'under_20k', query: 'under 20000', max: 20000, min: 15000 },
      { name: 'under_30k', query: 'under 30000', max: 30000, min: 20000 },
      { name: 'under_40k', query: 'under 40000', max: 40000, min: 30000 },
      { name: 'under_50k', query: 'under 50000', max: 50000, min: 40000 },
      { name: 'under_70k', query: 'under 70000', max: 70000, min: 50000 },
      { name: 'under_100k', query: 'under 100000', max: 100000, min: 70000 },
      { name: 'above_100k', query: 'above 100000', max: 500000, min: 100000 }
    ];
  }

  /**
   * Make API request to ScrapingDog Amazon Search API
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} - Array of products
   */
  async makeRequest(params) {
    try {
      const queryParams = new URLSearchParams({
        api_key: this.apiKey,
        domain: 'in',
        country: 'in',
        language: 'en',
        ...params
      });

      const url = `${this.baseURL}?${queryParams}`;
      console.log(`📡 ScrapingDog Request: ${params.query}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'TrustfolioBot/1.0'
        },
        timeout: 60000 // 60 seconds timeout
      });

      if (response.data && response.data.results) {
        console.log(`✅ ScrapingDog: Found ${response.data.results.length} products`);
        return response.data.results;
      } else {
        console.warn('⚠️  ScrapingDog: No results in response');
        return [];
      }
    } catch (error) {
      console.error('❌ ScrapingDog API Error:', error.message);
      if (error.response) {
        console.error('❌ Response Status:', error.response.status);
        console.error('❌ Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Search products for a category across all price ranges
   * @param {string} category - Category name (e.g., 'smartphone', 'laptop')
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Results grouped by price range
   */
  async searchProductsAllRanges(category, options = {}) {
    const { maxPages = 2, maxProductsPerRange = 40 } = options;
    const results = {};

    console.log(`🔍 Starting bulk search for category: ${category}`);

    for (const range of this.priceRanges) {
      console.log(`💰 Searching ${category} ${range.query}...`);
      
      try {
        const searchQuery = `best ${category} ${range.query}`;
        const rangeProducts = [];

        // Fetch multiple pages for each price range
        for (let page = 1; page <= maxPages; page++) {
          try {
            const pageProducts = await this.makeRequest({
              query: searchQuery,
              page: page.toString()
            });

            if (pageProducts.length === 0) {
              console.log(`📄 No more products on page ${page} for ${range.name}`);
              break;
            }

            // Filter products by price range and add to results
            const filteredProducts = this.filterProductsByPrice(pageProducts, range);
            rangeProducts.push(...filteredProducts);

            console.log(`📄 Page ${page}: ${filteredProducts.length} valid products for ${range.name}`);

            // Stop if we have enough products
            if (rangeProducts.length >= maxProductsPerRange) {
              break;
            }

            // Rate limiting between page requests
            await this.delay(2000);

          } catch (pageError) {
            console.error(`❌ Error fetching page ${page} for ${range.name}:`, pageError.message);
          }
        }

        // Limit products per range
        results[range.name] = rangeProducts.slice(0, maxProductsPerRange);
        console.log(`✅ ${range.name}: ${results[range.name].length} products collected`);

        // Rate limiting between price ranges  
        await this.delay(3000);

      } catch (rangeError) {
        console.error(`❌ Error searching ${range.name}:`, rangeError.message);
        results[range.name] = [];
      }
    }

    const totalProducts = Object.values(results).reduce((sum, products) => sum + products.length, 0);
    console.log(`🎉 Search completed for ${category}: ${totalProducts} total products`);

    return results;
  }

  /**
   * Search products for a specific category and price range
   * @param {string} category - Category name
   * @param {string} priceRange - Price range name
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of products
   */
  async searchProductsForRange(category, priceRange, options = {}) {
    const { maxPages = 2, maxProducts = 40 } = options;
    
    const range = this.priceRanges.find(r => r.name === priceRange);
    if (!range) {
      throw new Error(`Invalid price range: ${priceRange}`);
    }

    console.log(`🔍 Searching ${category} for ${range.name} (${range.query})`);

    const searchQuery = `best ${category} ${range.query}`;
    const products = [];

    for (let page = 1; page <= maxPages; page++) {
      try {
        const pageProducts = await this.makeRequest({
          query: searchQuery,
          page: page.toString()
        });

        if (pageProducts.length === 0) {
          console.log(`📄 No more products on page ${page}`);
          break;
        }

        const filteredProducts = this.filterProductsByPrice(pageProducts, range);
        products.push(...filteredProducts);

        console.log(`📄 Page ${page}: ${filteredProducts.length} valid products`);

        if (products.length >= maxProducts) {
          break;
        }

        await this.delay(2000);

      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error.message);
      }
    }

    return products.slice(0, maxProducts);
  }

  /**
   * Filter products by price range
   * @param {Array} products - Raw products from API
   * @param {Object} range - Price range object
   * @returns {Array} - Filtered products
   */
  filterProductsByPrice(products, range) {
    return products.filter(product => {
      if (!product.price_string) return false;
      
      const price = this.extractNumericPrice(product.price_string);
      if (!price || price <= 0) return false;

      return price >= range.min && price <= range.max;
    });
  }

  /**
   * Extract numeric price from price string
   * @param {string} priceString - Price string like "₹4,399"
   * @returns {number} - Numeric price
   */
  extractNumericPrice(priceString) {
    if (!priceString) return 0;
    
    // Remove currency symbols and convert to number
    const cleanPrice = priceString.replace(/[₹$,\s]/g, '').replace(/[^\d.]/g, '');
    return parseFloat(cleanPrice) || 0;
  }

  /**
   * Parse product data from ScrapingDog response
   * @param {Object} rawProduct - Raw product from API
   * @param {Object} category - Category object
   * @param {Object} searchInfo - Search metadata
   * @returns {Object|null} - Parsed product data
   */
  parseProductData(rawProduct, category, searchInfo = {}) {
    try {
      // Extract price
      const price = this.extractNumericPrice(rawProduct.price_string);
      if (!price || price <= 0) {
        console.warn('⚠️  Skipping product: Invalid price');
        return null;
      }

      // Extract rating
      const rating = parseFloat(rawProduct.stars) || 0;
      const totalReviews = this.extractReviewCount(rawProduct.total_reviews);

      // Extract images
      const images = this.extractImages(rawProduct);
      
      // Extract ASIN from URL or direct field
      const asin = this.extractASIN(rawProduct);
      if (!asin) {
        console.warn('⚠️  Skipping product: No ASIN found');
        return null;
      }

      // Basic validation
      if (!rawProduct.title || rawProduct.title.length < 10) {
        console.warn('⚠️  Skipping product: Invalid title');
        return null;
      }

      // Determine price range
      const priceRangeName = this.determinePriceRange(price);

      // Structure the product data
      const productData = {
        asin: asin,
        title: rawProduct.title.trim(),
        brand: this.extractBrand(rawProduct.title),
        category: category._id,
        categoryName: category.name,
        
        pricing: {
          current: price,
          original: price, // ScrapingDog doesn't provide original price
          discount: {},
          currency: 'INR',
          priceRange: priceRangeName
        },
        
        url: rawProduct.url || rawProduct.optimized_url || `https://www.amazon.in/dp/${asin}`,
        images: images,
        primaryImage: images.length > 0 ? images[0].url : null,
        
        description: {
          short: rawProduct.title.trim(),
          bullets: []
        },
        
        rating: {
          average: rating,
          totalReviews: totalReviews
        },
        
        availability: {
          status: 'unknown',
          deliveryInfo: rawProduct.number_of_people_bought || null
        },
        
        badges: {
          isPrime: rawProduct.has_prime || false,
          isBestSeller: rawProduct.is_best_seller || false,
          isAmazonChoice: rawProduct.is_amazon_choice || false,
          isLimitedDeal: rawProduct.limited_time_deal || false
        },
        
        scrapingInfo: {
          scrapedAt: new Date(),
          source: 'scrapingdog',
          searchQuery: searchInfo.query || '',
          priceRangeQueried: searchInfo.priceRange || {},
          position: rawProduct.absolute_position || 0
        },
        
        isActive: true,
        quality: this.assessProductQuality(rawProduct, rating, totalReviews)
      };

      return productData;

    } catch (error) {
      console.error('❌ Error parsing product data:', error.message);
      return null;
    }
  }

  /**
   * Extract review count from string
   * @param {string} reviewString - Review string like "7,647"
   * @returns {number} - Numeric review count
   */
  extractReviewCount(reviewString) {
    if (!reviewString) return 0;
    
    const cleanCount = reviewString.replace(/[,\s]/g, '').replace(/[^\d]/g, '');
    return parseInt(cleanCount) || 0;
  }

  /**
   * Extract images from product
   * @param {Object} product - Product object
   * @returns {Array} - Array of image objects
   */
  extractImages(product) {
    const images = [];
    
    if (product.image && product.image.startsWith('http')) {
      images.push({
        url: product.image,
        alt: product.title || 'Product image',
        isPrimary: true
      });
    }
    
    return images;
  }

  /**
   * Extract ASIN from product data
   * @param {Object} product - Product object
   * @returns {string|null} - ASIN
   */
  extractASIN(product) {
    // Direct ASIN field
    if (product.asin) {
      return product.asin;
    }
    
    // Extract from URL
    const url = product.url || product.optimized_url || '';
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
    if (asinMatch) {
      return asinMatch[1];
    }
    
    return null;
  }

  /**
   * Extract brand from title
   * @param {string} title - Product title
   * @returns {string|null} - Brand name
   */
  extractBrand(title) {
    if (!title) return null;
    
    // Common brand extraction patterns
    const brandPatterns = [
      /^(\w+)\s+/,  // First word
      /(\w+)\s+\w+/  // Brand usually in first few words
    ];
    
    for (const pattern of brandPatterns) {
      const match = title.match(pattern);
      if (match) {
        const brand = match[1];
        // Filter out common words that aren't brands
        const commonWords = ['best', 'new', 'latest', 'premium', 'original', 'genuine'];
        if (!commonWords.includes(brand.toLowerCase())) {
          return brand;
        }
      }
    }
    
    return null;
  }

  /**
   * Determine price range based on price
   * @param {number} price - Product price
   * @returns {string} - Price range name
   */
  determinePriceRange(price) {
    for (const range of this.priceRanges) {
      if (price >= range.min && price <= range.max) {
        return range.name;
      }
    }
    return 'unknown';
  }

  /**
   * Assess product quality based on available data
   * @param {Object} product - Raw product data
   * @param {number} rating - Product rating
   * @param {number} totalReviews - Total review count
   * @returns {string} - Quality score (high/medium/low)
   */
  assessProductQuality(product, rating, totalReviews) {
    let score = 0;
    
    // Rating score (40% weight)
    if (rating >= 4.0 && totalReviews >= 100) {
      score += 40;
    } else if (rating >= 3.5 && totalReviews >= 50) {
      score += 30;
    } else if (rating >= 3.0) {
      score += 20;
    }
    
    // Review count (30% weight)
    if (totalReviews >= 1000) {
      score += 30;
    } else if (totalReviews >= 100) {
      score += 20;
    } else if (totalReviews >= 10) {
      score += 10;
    }
    
    // Badge quality (20% weight)
    if (product.is_best_seller) {
      score += 10;
    }
    if (product.is_amazon_choice) {
      score += 10;
    }
    
    // Title quality (10% weight)
    if (product.title && product.title.length >= 50) {
      score += 10;
    } else if (product.title && product.title.length >= 20) {
      score += 5;
    }
    
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Get available price ranges
   * @returns {Array} - Array of price range objects
   */
  getPriceRanges() {
    return this.priceRanges;
  }

  /**
   * Utility: Add delay between requests
   * @param {number} ms - Milliseconds to wait
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ScrapingDogService();
