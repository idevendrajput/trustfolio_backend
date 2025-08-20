const axios = require('axios');
require('dotenv').config();

class ScrapingDogService {
  constructor() {
    this.apiKey = process.env.SCRAPINGDOG_API_KEY || '689c8109805081418fca0f52';
    this.baseURL = 'https://api.scrapingdog.com/amazon';
    this.searchURL = this.baseURL + '/search';
    this.productURL = this.baseURL + '/product';
    
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
   * Search products with enhanced parameters
   * @param {string} query - Search query
   * @param {string} pincode - Indian pincode for location-based results
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} - Array of products
   */
  async searchProducts(query, pincode = '110001', limit = 20) {
    try {
      const params = {
        api_key: this.apiKey,
        type: 'search',
        amazon_domain: 'amazon.in',
        search_query: query,
        location: pincode
      };

      const queryParams = new URLSearchParams(params);
      const url = `${this.searchURL}?${queryParams}`;
      
      console.log(`🔍 ScrapingDog Search: ${query} (${pincode})`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'TrustfolioBot/1.0'
        },
        timeout: 60000
      });

      if (response.data && response.data.search_results) {
        const products = response.data.search_results.slice(0, limit);
        console.log(`✅ Found ${products.length} products for "${query}"`);
        return products;
      } else {
        console.warn('⚠️  No search results found');
        return [];
      }
    } catch (error) {
      console.error('❌ Search products error:', error.message);
      throw error;
    }
  }

  /**
   * Get detailed product information by ASIN
   * @param {string} asin - Amazon Standard Identification Number
   * @returns {Promise<Object>} - Detailed product information
   */
  async getProductDetails(asin) {
    try {
      const params = {
        api_key: this.apiKey,
        type: 'product',
        amazon_domain: 'amazon.in',
        asin: asin
      };

      const queryParams = new URLSearchParams(params);
      const url = `${this.productURL}?${queryParams}`;
      
      console.log(`📦 ScrapingDog Product Details: ${asin}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'TrustfolioBot/1.0'
        },
        timeout: 60000
      });

      if (response.data && response.data.asin) {
        console.log(`✅ Retrieved details for ASIN: ${asin}`);
        return response.data;
      } else {
        throw new Error(`No product data found for ASIN: ${asin}`);
      }
    } catch (error) {
      console.error(`❌ Product details error for ${asin}:`, error.message);
      throw error;
    }
  }

  /**
   * Get multiple product details by ASINs
   * @param {Array<string>} asins - Array of ASINs
   * @returns {Promise<Object>} - Object with products and errors
   */
  async getBulkProductDetails(asins) {
    const results = {
      products: {},
      errors: {},
      totalRequested: asins.length,
      totalSuccessful: 0,
      totalFailed: 0
    };

    console.log(`🔍 Fetching bulk product details for ${asins.length} ASINs`);

    for (const asin of asins) {
      try {
        const productDetails = await this.getProductDetails(asin);
        results.products[asin] = productDetails;
        results.totalSuccessful++;
        
        // Rate limiting
        await this.delay(500);
        
      } catch (error) {
        results.errors[asin] = error.message;
        results.totalFailed++;
      }
    }

    console.log(`✅ Bulk fetch completed: ${results.totalSuccessful} successful, ${results.totalFailed} failed`);
    return results;
  }

  /**
   * Preview category products without saving
   * @param {string} category - Category name
   * @param {Object} options - Preview options
   * @returns {Promise<Object>} - Preview results
   */
  async previewCategoryProducts(category, options = {}) {
    const {
      query,
      pincode = '110001',
      limit = 20
    } = options;

    try {
      // Use custom query or generate default ones
      const queries = query ? [query] : this.generateCategoryQueries(category).slice(0, 3);
      
      const allProducts = [];
      const usedAsins = new Set();
      
      console.log(`👀 Previewing products for category: ${category}`);

      for (const searchQuery of queries) {
        try {
          const products = await this.searchProducts(searchQuery, pincode);
          
          for (const product of products) {
            const asin = this.extractASIN(product);
            if (asin && !usedAsins.has(asin)) {
              allProducts.push(product);
              usedAsins.add(asin);
              
              if (allProducts.length >= limit) {
                break;
              }
            }
          }
          
          if (allProducts.length >= limit) {
            break;
          }
          
          // Rate limiting between queries
          await this.delay(200);
          
        } catch (error) {
          console.warn(`⚠️  Query "${searchQuery}" failed: ${error.message}`);
          continue;
        }
      }

      return {
        category,
        pincode,
        queriesUsed: queries,
        totalProducts: allProducts.length,
        products: allProducts
      };

    } catch (error) {
      console.error(`❌ Preview error for ${category}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate category-specific search queries
   * @param {string} category - Category name
   * @returns {Array<string>} - Array of search queries
   */
  generateCategoryQueries(category) {
    const queries = [];
    
    // Base queries with price ranges
    const priceRanges = [
      'under 10000',
      'under 20000',
      'under 30000',
      'under 50000',
      'under 100000'
    ];
    
    for (const priceRange of priceRanges) {
      queries.push(`best ${category} ${priceRange}`);
    }
    
    // Brand-specific queries
    const brandMappings = {
      earbuds: ['sony', 'jbl', 'boat', 'oneplus', 'realme'],
      tv: ['samsung', 'lg', 'sony', 'mi', 'oneplus'],
      laptop: ['hp', 'dell', 'lenovo', 'asus', 'acer'],
      smartphone: ['samsung', 'oneplus', 'realme', 'xiaomi', 'iphone'],
      ac: ['lg', 'samsung', 'voltas', 'daikin', 'godrej'],
      'washing machine': ['lg', 'samsung', 'whirlpool', 'bosch', 'ifb'],
      refrigerator: ['lg', 'samsung', 'whirlpool', 'godrej', 'haier'],
      camera: ['canon', 'nikon', 'sony', 'fujifilm', 'panasonic']
    };
    
    const brands = brandMappings[category.toLowerCase()] || [];
    for (const brand of brands) {
      queries.push(`${brand} ${category}`);
      queries.push(`best ${brand} ${category}`);
    }
    
    // Feature-specific queries
    const featureMappings = {
      earbuds: ['wireless earbuds', 'noise cancelling earbuds', 'gaming earbuds'],
      tv: ['smart tv', '4k tv', 'led tv', 'android tv'],
      laptop: ['gaming laptop', 'business laptop', 'thin laptop'],
      smartphone: ['5g smartphone', 'camera phone', 'gaming phone'],
      ac: ['split ac', 'window ac', 'inverter ac'],
      'washing machine': ['front load washing machine', 'top load washing machine'],
      refrigerator: ['double door refrigerator', 'single door refrigerator'],
      camera: ['dslr camera', 'mirrorless camera', 'point and shoot camera']
    };
    
    const features = featureMappings[category.toLowerCase()] || [];
    queries.push(...features);
    
    return [...new Set(queries)];
  }

  /**
   * Sync category products with enhanced parsing
   * @param {Object} category - Category object
   * @param {number} maxProducts - Maximum products to sync
   * @returns {Promise<Object>} - Sync results
   */
  async syncCategoryProducts(category, maxProducts = 50) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      console.log(`🔄 Starting sync for category: ${category.name}`);
      
      // Get search queries for this category
      const searchQueries = category.searchQueries && category.searchQueries.length > 0
        ? category.searchQueries
        : this.generateCategoryQueries(category.name).slice(0, 5);
      
      const pincodes = ['110001', '400001', '560001', '700001']; // Major cities
      
      for (const query of searchQueries) {
        for (const pincode of pincodes) {
          try {
            const products = await this.searchProducts(query, pincode);
            
            for (const productData of products) {
              if (results.success >= maxProducts) {
                break;
              }
              
              try {
                const parsedProduct = this.parseProductDataEnhanced(productData, category, { query, pincode });
                if (parsedProduct) {
                  // Here you would save to database
                  results.success++;
                }
                
                // Rate limiting
                await this.delay(200);
                
              } catch (error) {
                results.failed++;
                results.errors.push(`Product parse error: ${error.message}`);
              }
            }
            
            if (results.success >= maxProducts) {
              break;
            }
            
            // Rate limiting between searches
            await this.delay(1000);
            
          } catch (error) {
            results.errors.push(`Search error for "${query}" in ${pincode}: ${error.message}`);
          }
        }
        
        if (results.success >= maxProducts) {
          break;
        }
      }
      
    } catch (error) {
      results.errors.push(`Category sync error: ${error.message}`);
    }

    console.log(`✅ Sync completed for ${category.name}: ${results.success} success, ${results.failed} failed`);
    return results;
  }

  /**
   * Enhanced product data parsing with new model structure
   * @param {Object} rawProduct - Raw product from API
   * @param {Object} category - Category object
   * @param {Object} searchInfo - Search metadata
   * @returns {Object|null} - Parsed product data
   */
  parseProductDataEnhanced(rawProduct, category, searchInfo = {}) {
    try {
      const asin = this.extractASIN(rawProduct);
      if (!asin) return null;
      
      const price = this.extractNumericPrice(rawProduct.price_string || rawProduct.price);
      if (!price || price <= 0) return null;
      
      if (!rawProduct.title || rawProduct.title.length < 10) return null;
      
      const rating = parseFloat(rawProduct.stars || rawProduct.rating) || 0;
      const totalReviews = this.extractReviewCount(rawProduct.total_reviews || rawProduct.reviews_count);
      const images = this.extractImages(rawProduct);
      
      return {
        asin,
        title: rawProduct.title.trim(),
        description: rawProduct.description || null,
        brand: this.extractBrand(rawProduct.title),
        brandUrl: rawProduct.brand_url || null,
        category: category._id,
        categoryName: category.name,
        productCategory: rawProduct.product_category || null,
        
        // Images
        mainImage: images.length > 0 ? images[0].url : null,
        images,
        numberOfVideos: rawProduct.number_of_videos || 0,
        
        // Pricing
        pricing: {
          current: price,
          list: this.extractNumericPrice(rawProduct.list_price) || null,
          previous: this.extractNumericPrice(rawProduct.previous_price) || null,
          symbol: '₹',
          currency: 'INR',
          priceRange: this.determinePriceRange(price)
        },
        
        // Amazon badges
        badges: {
          isPrimeExclusive: rawProduct.is_prime_exclusive || false,
          isBestSeller: rawProduct.is_best_seller || false,
          isAmazonChoice: rawProduct.is_amazon_choice || false,
          limitedTimeDeal: rawProduct.limited_time_deal || false,
          dealOfTheDay: rawProduct.deal_of_the_day || false,
          isCouponExists: rawProduct.is_coupon_exists || false,
          couponText: rawProduct.coupon_text || null
        },
        
        // Availability
        availability: {
          status: 'unknown',
          numberOfPeopleBought: rawProduct.number_of_people_bought || null,
          shippingInfo: rawProduct.shipping_info || null
        },
        
        // Rating
        rating: {
          average: rating,
          totalReviews,
          stars: rawProduct.stars || null
        },
        
        // Product details
        featureBullets: rawProduct.feature_bullets || [],
        productInformation: rawProduct.product_information || null,
        specifications: rawProduct.specifications || null,
        
        // URLs
        amazonUrl: rawProduct.url || rawProduct.amazon_url || `https://www.amazon.in/dp/${asin}`,
        optimizedUrl: rawProduct.optimized_url || null,
        
        // Customer feedback
        customerReviews: rawProduct.customer_reviews || [],
        ratingsDistribution: rawProduct.ratings_distribution || null,
        customersSay: rawProduct.customers_say || null,
        
        // Scraping info
        scrapingInfo: {
          scrapedAt: new Date(),
          source: 'scrapingdog',
          searchQuery: searchInfo.query || '',
          priceRangeQueried: searchInfo.priceRange || {},
          position: rawProduct.position || 0,
          syncStatus: 'success',
          lastSyncAt: new Date()
        },
        
        isActive: true,
        quality: this.assessProductQuality(rawProduct, rating, totalReviews)
      };
      
    } catch (error) {
      console.error('❌ Enhanced parsing error:', error.message);
      return null;
    }
  }

  /**
   * Sync outdated products
   * @param {number} limit - Maximum products to sync
   * @returns {Promise<Object>} - Sync results
   */
  async syncOutdatedProducts(limit = 100) {
    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    console.log(`🔄 Starting outdated products sync (limit: ${limit})`);
    
    try {
      // This would typically fetch from database
      // For now, we'll simulate the process
      results.updated = 0;
      results.failed = 0;
      
    } catch (error) {
      results.errors.push(`Outdated sync error: ${error.message}`);
    }

    return results;
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
