FROM node:20-alpine

ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG FRONTEND_PUBLIC_URL=http://10.218.105.8:3000
ENV FRONTEND_PUBLIC_URL=$FRONTEND_PUBLIC_URL

WORKDIR /app

# Install dependencies using frontend package configuration
COPY frontend/package*.json ./
RUN npm install

# Copy frontend Next.js app and shared src directory into the expected relative layout
COPY frontend/ ./frontend/
COPY src/ ./src/

# Ensure static image assets are available in Next.js public directory
RUN mkdir -p /app/frontend/public/assets/images /app/frontend/public/src/assets/images && \
    cp -r /app/src/assets/images/* /app/frontend/public/assets/images/ && \
    cp -r /app/src/assets/images/* /app/frontend/public/src/assets/images/

# Link node_modules so Next.js finds all modules in frontend and src
RUN ln -s /app/node_modules /app/frontend/node_modules

WORKDIR /app/frontend

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
