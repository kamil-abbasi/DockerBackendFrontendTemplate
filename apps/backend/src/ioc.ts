import { Container } from "./container";

/**
 * Single composition root instance, shared by the app and by the
 * tsoa-generated routes (see `routes.iocModule` in tsoa.json).
 */
export const container = new Container();

/** tsoa looks for an export named exactly `iocContainer`. */
export const iocContainer = container;
