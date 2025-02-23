class ApiService {
  private static instance: ApiService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = 'http://172.16.16.75:8000/api';
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public async getProduct(productId: string) {
    return this.request(`/products/${productId}`, 'GET');
  }

  private async request(endpoint: string, method: string, body?: any) {
    const headers = {
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  public getChatMessages(chatId: string) {
    return this.request(`/chats/${chatId}`, 'GET');
  }

  public sendMessage(chatId: string, message: { sender: string; text: string }) {
    return this.request(`/chats/${chatId}/message`, 'PATCH', message);
  }

  public evaluatePrice(payload: {
    desc: string;
    price: number;
    seller: string;
    image_urls: string[];
  }) {
    return this.request('/evaluate-price', 'POST', payload);
  }

  public generateLocationSuggestions(payload: {
    lat1: number;
    lon1: number;
    lat2: number;
    lon2: number;
  }) {
    return this.request('/generate-location', 'POST', payload);
  }

  public createCheckoutSession(payload: { line_items: any[]; return_url: string }) {
    return this.request('/stripe/create-payment-intent', 'POST', payload);
  }

  public updateItem(itemId: string, updates: any) {
    return this.request(`/items/${itemId}`, 'PATCH', updates);
  }

  public createChat() {
    return this.request('/chats', 'POST');
  }

  public updateProduct(productId: string, updates: any) {
    return this.request(`/products/${productId}`, 'PATCH', updates);
  }

  public updateChat(chatId: string, updates: any) {
    return this.request(`/chats/${chatId}`, 'PATCH', updates);
  }

  public getProducts() {
    return this.request('/products', 'GET');
  }
}

export default ApiService.getInstance();
