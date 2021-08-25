const { expect } = require("chai");

const START_PRICE = ethers.utils.parseEther("0.01");
const START_MSG = "Hello, world!";
const BASE_URI = "https://cryptobillboard.org/NFT/";
const NFT_URI = "1.json";
const C_URI = "https://cryptobillboard.org/contractURI.json";

describe("Billboard", function () {
  let owner, addr2, addr3;
  let billboard;

  before(async function () {
    [owner, addr2, addr3] = await ethers.getSigners();

    const Billboard = await ethers.getContractFactory("Billboard", owner);
    billboard = await Billboard.deploy(START_PRICE, START_MSG, BASE_URI, C_URI);
    await billboard.deployed();
  });

  describe("setup", function () {
    it("default the right msg", async () => {
      expect(await billboard.message()).to.equal(START_MSG);
    });

    it("has min price", async () => {
      expect(await billboard.price()).to.equal(START_PRICE);
    });

    it("returns the right info", async () => {
      const [message, price, publisher] = await billboard.getInfo();
      expect(price).to.equal(START_PRICE);
      expect(message).to.equal(START_MSG);
      expect(publisher).to.equal(owner.address);
    });

    it("has baseURI", async function () {
      expect(await billboard.contractURI()).to.eq(C_URI);
    });
  });

  describe("setMessage", function () {
    describe("wrong path", function () {
      it("Should error on empty tx", async function () {
        await expect(billboard.setMessage("foo")).to.be.revertedWith(
          "Payment needs to be above the current price"
        );
      });

      it("Should error on low price", async function () {
        const price = await billboard.price();
        const value = price.sub(ethers.utils.parseEther("0.001"));
        await expect(billboard.setMessage("foo", { value })).to.be.revertedWith(
          "Payment needs to be above the current price"
        );
      });
    });

    describe("happy path", function () {
      const value = ethers.utils.parseEther("1");
      const NEW_MSG = "foo2";
      let newMsgAction;

      before(async function () {
        newMsgAction = await billboard
          .connect(addr2)
          .setMessage(NEW_MSG, { value });
      });

      describe("Billboard logic", function () {
        it("replaces billboard on right price", async function () {
          expect(await billboard.message()).to.equal(NEW_MSG);
        });

        it("increases the minPrice", async function () {
          expect(await billboard.price()).to.equal(value);
        });

        it("sets the publisher", async function () {
          expect(await billboard.publisher()).to.equal(addr2.address);
        });
      });

      describe("Emit event", function () {
        it("emit NewMessage event", async function () {
          expect(newMsgAction)
            .to.emit(billboard, "NewMessage")
            .withArgs(NEW_MSG, value, addr2.address);
        });
      });

      describe("NFT mint", function () {
        it("mint new NFT", async function () {
          const balance = await billboard.balanceOf(addr2.address);
          expect(balance).to.equal(1);
        });

        it("has the right NFT owner", async function () {
          const owner = await billboard.ownerOf(1); // 1=owner on init
          expect(owner).to.equal(addr2.address);
        });

        it("has the right NFT URI", async function () {
          const uri = await billboard.tokenURI(1); // 1=owner on init
          expect(uri).to.equal(BASE_URI + NFT_URI);
        });
      });

      describe("Total Messages", function () {
        it("increases total messages", async () => {
          expect(await billboard.totalMessages()).to.equal(1);
        });
      });

      describe("Total paid", function () {
        it("increases total paid", async () => {
          expect(await billboard.totalPaid()).to.equal(value);
        });
      });
    });
  });

  describe("withdrawAll", function () {
    it("errors on other user call", async function () {
      await expect(billboard.connect(addr2).withdrawAll()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("increases admin balance", async function () {
      const balance = await ethers.provider.getBalance(billboard.address);
      await expect(await billboard.withdrawAll()).to.changeEtherBalance(
        owner,
        balance
      );
    });
  });

  describe("grantNewNFT", function () {
    describe("non owner", function () {
      it("errors on non-owner user call", async function () {
        await expect(
          billboard.connect(addr2).grantNewNFT(addr3.address, "2.json")
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("owner", function () {
      before(async function () {
        await billboard.grantNewNFT(addr3.address, "2.json");
      });

      it("grants NFT as admin", async function () {
        const balance = await billboard.balanceOf(addr3.address);
        expect(balance).to.equal(1);
      });

      it("sets the right URI", async function () {
        const uri = await billboard.tokenURI(2);
        expect(uri).to.equal(BASE_URI + "2.json");
      });
    });
  });

  describe("contractURI", function () {
    it("errors on other user call", async function () {
      await expect(
        billboard.connect(addr2).setContractURI("foo")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("has the same baseURI", async function () {
      expect(await billboard.contractURI()).to.eq(C_URI);
    });

    it("update contractURI when admin calls", async function () {
      const NEW_URI = "https://foo.bar/";

      await billboard.setContractURI(NEW_URI);
      expect(await billboard.contractURI()).to.eq(NEW_URI);
    });
  });
});
