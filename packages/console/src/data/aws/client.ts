import { useMemo } from "react";
import { useAuth, useSSL } from "../global";
import { Client } from "@smithy/smithy-client";
import { RegionInputConfig } from "@smithy/config-resolver";
import { RetryInputConfig } from "@smithy/middleware-retry";
import { AwsAuthInputConfig } from "@aws-sdk/middleware-signing";
import { FetchHttpHandler } from "@aws-sdk/fetch-http-handler";
//import { } from "@smithy/smithy-client";

type Config = RegionInputConfig & RetryInputConfig & AwsAuthInputConfig;

class CustomHandler extends FetchHttpHandler {
  private readonly ssl: boolean;
  constructor(ssl: boolean) {
    super();
    this.ssl = ssl;
  }
  handle(req: any, opts: any) {
    const { protocol, hostname, path } = req;
    req.protocol = this.ssl ? "https:" : "http:";
    req.hostname = "localhost:13557";
    req.path = `/proxy/${protocol}//${hostname}${path}`;
    return super.handle(req, opts);
  }
}

export function useClient<C extends Client<any, any, any, any>>(
  svc: new (config: Config) => C
) {
  const [ssl] = useSSL();
  const auth = useAuth();
  return useMemo(
    () =>
      new svc({
        ...auth.data!,
        // @ts-ignore
        requestHandler: new CustomHandler(ssl),
        maxAttempts: 3,
      }) as C,
    [auth.data]
  );
}
