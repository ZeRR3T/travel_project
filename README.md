# Travel Project

A project for searching hotels and flight tickets using real APIs.

## Features

### Hotel Search
- **Real hotel search** through SerpAPI (Google Hotels)
- Filtering by quality (rating, number of reviews)
- Detailed hotel information
- Images and current prices

### Flight Search
- **Real flight search** through SerpAPI (Google Search)
- Search by departure and arrival cities
- Date and passenger count selection
- **Clickable results** - each flight opens a detailed page
- **Direct links to booking sites** on the flight page
- Current prices and schedules

## Technologies

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Hotel Search**: SerpAPI (Google Hotels)
- **Flight Search**: SerpAPI (Google Search) + direct integration
- **AI**: OpenRouter API (Google Gemini) for general queries
- **Database**: Prisma + PostgreSQL

## Installation and Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure the local PostgreSQL database:**

Create a local PostgreSQL database named `travel_db`, then copy `.env.example` to `.env` and set `DATABASE_URL` to the local database connection string. Replace `YOUR_LOCAL_PASSWORD` with the password for your PostgreSQL role. Keep `.env` local; it is ignored by Git.

Set the required API keys in `.env`:
```bash
SERPAPI_KEY=your_serpapi_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_GEMINI_API_KEY=your_gemini_openrouter_key_here
```

Set `ADMIN_EMAIL` before running either admin initialization script. Before running `create-admin-user.js`, also set `ADMIN_INITIAL_PASSWORD` to a unique password of at least 16 characters; the script does not print it. To show contact emails in the footer and legal pages, configure `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_PRIVACY_EMAIL`, and `NEXT_PUBLIC_LEGAL_EMAIL`.

3. **Apply the database migrations:**
```bash
npx prisma generate
npx prisma migrate deploy
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)**

## API Endpoints

### Hotel Search
- `POST /api/search` - search hotels by text query

### Flight Search
- `POST /api/flight-search` - search flights by parameters

### Authentication
- `POST /api/auth/register` - user registration
- `POST /api/auth/login` - user login
- `GET /api/auth/[...nextauth]` - NextAuth.js

## Flight Search Features

### Real Data
- Search is performed through Google Search API
- Integration with real booking sites
- Current prices and schedules
- Direct booking links

### Search Parameters
- **Departure city** (with automatic airport code detection)
- **Arrival city** (with automatic airport code detection)
- **Departure date**
- **Number of passengers**

### Search Results
- Airline name (extracted from search results)
- Departure and arrival airport codes
- Departure and arrival times
- Flight duration
- Ticket price (if available)
- Number of stops
- Service class
- **Clickable flight cards** for navigation to details
- **Detailed flight page** with complete information
- **Direct link to booking site** on the flight page

### Intelligent Search
- Automatic airport code detection
- Result filtering by relevance
- Duplicate removal
- Fallback to alternative sources

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main pages
│   │   ├── flights/       # Flight search
│   │   └── hotels/        # Hotel search
│   └── api/               # API endpoints
├── components/             # React components
├── lib/                    # Utilities and API clients
│   ├── flight-search.ts   # Flight search through SerpAPI
│   └── openrouter.ts      # Hotel search through SerpAPI
└── types/                  # TypeScript types
```

## Key Files

### `src/lib/flight-search.ts`
- Main flight search logic
- SerpAPI integration
- Search result processing
- Flight information extraction

### `src/app/(main)/flights/page.tsx`
- Flight search interface
- Result display
- Links to booking sites

## System Advantages

1. **Real data** - not fake results
2. **Direct links** - one-click access to booking
3. **Automatic detection** of airport codes
4. **Fallback mechanisms** - always have a result
5. **Intelligent filtering** of results
6. **Scalability** - easy to add new sources

## Limitations

- SerpAPI has limits on the number of requests
- Google Search API may change response structure
- Not all airlines may be available in results

## Development Plans

- [ ] Integration with additional airline APIs
- [ ] Search result caching
- [ ] Price change notifications
- [ ] Mobile application
- [ ] Multi-language support

## License

MIT
