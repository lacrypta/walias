import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import debug from "debug";
import { isValidDomain } from "@/lib/utils";

const log = debug("app:domains-service");

export class DomainsService {
  constructor(private prisma: PrismaClient) {}

  async findDomainById(id: string) {
    try {
      log("Looking up domain by id: %s", id);
      return await this.prisma.domain.findUnique({ where: { id } });
    } catch (error) {
      log("Error while looking up domain by id %s: %O", id, error);
      throw error;
    }
  }

  async createDomain({
    id,
    relays,
    adminPubkey,
    rootPrivkey,
  }: {
    id: string;
    relays: string[];
    adminPubkey: string;
    rootPrivkey: string;
  }) {
    try {
      id = id.trim().toLowerCase();

      if (!isValidDomain(id)) {
        throw new Error("Invalid domain name");
      }

      log("Creating domain with id: %s", id);

      const verifyKey = crypto.randomBytes(16).toString("hex");

      const newDomain = await this.prisma.domain.create({
        data: {
          id,
          rootPrivateKey: rootPrivkey,
          adminPubkey,
          verifyKey,
          verified: false,
          waliases: {
            create: [],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      log("Successfully created domain: %s", id);

      return {
        domain: newDomain.id,
        relays,
        adminPubkey: newDomain.adminPubkey,
        rootPubkey: rootPrivkey,
        verifyUrl: `https://${id}/.well-known/${verifyKey}`,
        verifyContent: verifyKey,
      };
    } catch (error) {
      log("Error while creating domain %s: %O", id, error);
      throw error;
    }
  }

  async updateDomain(
    id: string,
    {
      relays,
      adminPubkey,
      rootPrivkey,
    }: {
      relays: string[];
      adminPubkey: string;
      rootPrivkey?: string;
    }
  ) {
    try {
      id = id.trim().toLowerCase();

      if (!isValidDomain(id)) {
        throw new Error("Invalid domain name");
      }

      log("Updating domain with id: %s", id);

      const updatedDomain = await this.prisma.domain.update({
        where: { id },
        data: {
          adminPubkey,
          rootPrivateKey: rootPrivkey || undefined,
          updatedAt: new Date(),
        },
      });

      log("Successfully updated domain: %s", id);

      return {
        domain: updatedDomain.id,
        relays,
        adminPubkey: updatedDomain.adminPubkey,
        rootPubkey: updatedDomain.rootPrivateKey,
      };
    } catch (error) {
      log("Error while updating domain %s: %O", id, error);
      throw error;
    }
  }
}
