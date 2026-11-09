import type { ProviderDefinition } from "../define";
import canadaPost from "./canada-post";
import cmaCgm from "./cma-cgm";
import dhl from "./dhl";
import fedex from "./fedex";
import fourkites from "./fourkites";
import freightos from "./freightos";
import hapagLloyd from "./hapag-lloyd";
import maersk from "./maersk";
import msc from "./msc";
import one from "./one";
import project44 from "./project44";
import purolator from "./purolator";
import ship4wd from "./ship4wd";
import ups from "./ups";
import zim from "./zim";

/**
 * Every provider the hub knows. To add a partner: create its file in this folder with
 * defineProvider(), add it to this list, and set its credentials. Nothing else changes.
 */
export const PROVIDERS: ProviderDefinition[] = [
  // Ocean freight
  maersk, msc, zim, cmaCgm, hapagLloyd, one,
  // Air freight and express
  dhl, fedex, ups,
  // Canadian delivery
  canadaPost, purolator,
  // Freight forwarding
  ship4wd,
  // Multi-carrier platforms
  project44, freightos, fourkites,
];
