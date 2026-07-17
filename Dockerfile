# Usar una imagen base ligera de Node.js (versión 18, compatible con package.json)
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Definir la variable de entorno para producción
ENV NODE_ENV=production

# Copiar el archivo package.json
COPY package.json ./

# Instalar solo las dependencias de producción
RUN npm install --omit=dev

# Copiar la carpeta src con el código de la aplicación
COPY src/ ./src/

# Exponer el puerto en el que corre la aplicación (3000 por defecto)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
