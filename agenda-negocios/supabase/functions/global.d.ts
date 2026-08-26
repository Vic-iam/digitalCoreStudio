declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
  ): any;
}

declare namespace Deno {
  namespace env {
    function get(name: string): string | undefined;
  }

  function serve(handler: (request: Request) => Promise<Response> | Response): void;
}
