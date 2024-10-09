import { NextRequest, NextResponse } from "next/server";
import { WalletsService } from "@/services/wallets";
import debug from "debug";

const log = debug("app:wallet-endpoints");

export async function GET(
  req: NextRequest,
  { params }: { params: { domain: string; walletId: string } }
) {
  try {
    const walletsService = new WalletsService();
    const { domain, walletId } = params;
    const authenticatedPubkey = req.headers.get("x-authenticated-pubkey");

    if (!authenticatedPubkey) {
      return NextResponse.json(
        { reason: "Authentication required" },
        { status: 401 }
      );
    }

    log("Fetching wallet: %s in domain: %s", walletId, domain);

    const wallet = await walletsService.findWalletById(walletId);

    if (!wallet) {
      return NextResponse.json({ reason: "Wallet not found" }, { status: 404 });
    }

    if (wallet.pubkey !== authenticatedPubkey) {
      return NextResponse.json(
        { reason: "Invalid authentication" },
        { status: 403 }
      );
    }

    return NextResponse.json(wallet);
  } catch (error) {
    log("Error while fetching wallet: %O", error);
    return NextResponse.json(
      { reason: "Internal server error" },
      { status: 500 }
    );
  }
}
