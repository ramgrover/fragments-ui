# Development Stage
FROM node:20.17.0 AS development

LABEL maintainer="Ram Grover <ramgrover.rg@gmail.com>" \
      description="Fragments UI frontend"

# Use /app as our working directory
WORKDIR /app

# Copy package.json and package-lock.json files into the container
COPY package* ./

# Install dependencies for development
RUN npm install

# Copy the rest of the application files into the container (including index.html)
COPY . ./

# Expose the development port (Parcel uses 1234 by default)
EXPOSE 1234

# Run the Parcel development server
CMD ["npm", "start"]

#################################################################################################

# Production Stage (uses nginx)
FROM nginx:1.26.2-alpine AS production

# Copy the build assets from the development stage
COPY --from=development /app/dist /usr/share/nginx/html

# Define environment variables for production
ARG API_URL
ARG AWS_COGNITO_POOL_ID
ARG AWS_COGNITO_CLIENT_ID
ARG AWS_COGNITO_HOSTED_UI_DOMAIN
ARG OAUTH_SIGN_IN_REDIRECT_URL
ARG OAUTH_SIGN_OUT_REDIRECT_URL

ENV API_URL=$API_URL
ENV AWS_COGNITO_POOL_ID=$AWS_COGNITO_POOL_ID
ENV AWS_COGNITO_CLIENT_ID=$AWS_COGNITO_CLIENT_ID
ENV AWS_COGNITO_HOSTED_UI_DOMAIN=$AWS_COGNITO_HOSTED_UI_DOMAIN
ENV OAUTH_SIGN_IN_REDIRECT_URL=$OAUTH_SIGN_IN_REDIRECT_URL
ENV OAUTH_SIGN_OUT_REDIRECT_URL=$OAUTH_SIGN_OUT_REDIRECT_URL

# Expose the Nginx default port
EXPOSE 80

# Start the nginx server
CMD ["nginx", "-g", "daemon off;"]
