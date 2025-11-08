const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CryptoMixer", function () {
  let mixer;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const CryptoMixer = await ethers.getContractFactory("CryptoMixer");
    mixer = await CryptoMixer.deploy();
    await mixer.waitForDeployment();
  });

  it("Should accept deposits", async function () {
    const depositAmount = ethers.parseEther("0.1");
    const secret = ethers.keccak256(ethers.toUtf8Bytes("my-secret"));

    await expect(
      mixer.connect(addr1).deposit(secret, { value: depositAmount })
    ).to.emit(mixer, "DepositReceived");
  });

  it("Should reject deposits below minimum", async function () {
    const depositAmount = ethers.parseEther("0.001");
    const secret = ethers.keccak256(ethers.toUtf8Bytes("my-secret"));

    await expect(
      mixer.connect(addr1).deposit(secret, { value: depositAmount })
    ).to.be.revertedWith("Deposit too small");
  });

  it("Should return correct pool stats", async function () {
    const stats = await mixer.getPoolStats();
    expect(stats.minDeposit).to.equal(ethers.parseEther("0.01"));
    expect(stats.maxDeposit).to.equal(ethers.parseEther("10"));
    expect(stats.fee).to.equal(2);
  });
});
