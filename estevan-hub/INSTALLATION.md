# Estevan Hub - Installation Guide

## Basic Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/estevan-hub.git
   cd estevan-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   mysql -u root -p < db/database.sql
   ```

4. Configure environment variables by copying and modifying the example .env file:
   ```bash
   cp .env.example .env
   # Edit the .env file with your database credentials and other settings
   ```

5. Start the server:
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

## Installing Sharp for Image Optimization

The image optimization feature uses the Sharp library, which requires native dependencies. If you see an error like:

```
Error: Cannot find module 'sharp'
```

Install the Sharp module with:

```bash
npm install sharp
```

### Troubleshooting Sharp Installation

If you encounter issues installing Sharp, try:

1. Installing with specific platform flags:
   ```bash
   npm install --platform=linux --arch=x64 sharp
   ```

2. For older systems, you may need to install build tools:
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install -y build-essential
   
   # On CentOS/RHEL
   sudo yum groupinstall "Development Tools"
   
   # Then reinstall sharp
   npm install sharp
   ```

3. For more information, see the [Sharp installation guide](https://sharp.pixelplumbing.com/install).

## Verifying Installation

After installation, start the server and verify that image optimization is working:

```bash
node server.js
```

You should see: "✅ Image optimization available (sharp module loaded)"

If you see a warning about image optimization not being available, follow the sharp installation steps above.
