import { AsyncLocalStorage } from "async_hooks";
const requestContext = new AsyncLocalStorage();

const getRequestContext = () => requestContext;

const startRequest = async (callback) =>
  requestContext.run(new Map(), callback);

const getRequestVariable = (key) => {
  return requestContext.getStore()
    ? requestContext.getStore().get(key)
    : undefined;
};

const getRequestVariables = () => {
  return requestContext.getStore()
    ? Object.fromEntries(requestContext.getStore())
    : {};
};

const setRequestVariable = (key, value) => {
  if (requestContext.getStore()) {
    requestContext.getStore().set(key, value);
  }
};

export {
  getRequestContext,
  startRequest,
  getRequestVariable,
  getRequestVariables,
  setRequestVariable,
};
