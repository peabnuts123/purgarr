# Use Alpine base image
FROM node:20-alpine

# Configure cron
COPY crontab.properties /etc/crontabs/root
# Give permissions to node user to write to cron log
RUN touch /var/log/cron.log && \
  chmod 666 /var/log/cron.log

WORKDIR /home/node

# Application setup
COPY package*.json tsconfig.json ./
RUN npm install --omit=dev
# Ensure all app code is owned by node user
RUN chown -R node:node /home/node

# Start cron service and tail the cron log
CMD ["sh", "-c", "crond && tail -f /var/log/cron.log"]
