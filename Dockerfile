FROM public.ecr.aws/lambda/nodejs:18

COPY package.json ${LAMBDA_TASK_ROOT}/
RUN npm install --omit=dev

# Assumes your function is named "app.js", and there is a package.json file in the app directory 
COPY server.js ${LAMBDA_TASK_ROOT}/
COPY build ${LAMBDA_TASK_ROOT}/build
COPY public ${LAMBDA_TASK_ROOT}/public

RUN ls -la ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "server.handler" ]
