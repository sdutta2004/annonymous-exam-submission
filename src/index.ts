import { AnonymousExamSubmissionClient, CONTRACT_ADDRESS, getProofServerUrl } from './integration/contract.js';

const client = new AnonymousExamSubmissionClient();

function initApp() {
  const contractAddrEl = document.getElementById('contractAddr');
  const submissionCountEl = document.getElementById('submissionCount');
  const heroSubmissionCountEl = document.getElementById('heroSubmissionCount');
  const lastCommitmentEl = document.getElementById('lastCommitment');
  const logBoxEl = document.getElementById('logBox');
  const formEl = document.getElementById('submitExamForm') as HTMLFormElement;
  const examInput = document.getElementById('examInput') as HTMLInputElement;
  const studentKeyInput = document.getElementById('studentKeyInput') as HTMLInputElement;
  const answerContentInput = document.getElementById('answerContentInput') as HTMLTextAreaElement;
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const proofProviderEl = document.getElementById('proofProviderEl');
  const explorerProofServerEl = document.getElementById('explorerProofServerEl');

  // Admin page elements
  const updateExamBtn = document.getElementById('updateExamBtn');
  const newExamInput = document.getElementById('newExamInput') as HTMLInputElement;
  const adminNotice = document.getElementById('adminNotice');
  const adminLogArea = document.getElementById('adminLogArea');
  const adminLogBox = document.getElementById('adminLogBox');
  const incrementSessionBtn = document.getElementById('incrementSessionBtn');

  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (contractAddrEl) contractAddrEl.textContent = CONTRACT_ADDRESS;

  if (proofProviderEl) {
    proofProviderEl.textContent = isLocal ? "http://localhost:6300 (Local Docker)" : "Midnight Preprod Cloud ZK Service";
  }
  if (explorerProofServerEl) {
    explorerProofServerEl.textContent = isLocal ? "http://localhost:6300 (Status: ONLINE)" : "Midnight Preprod ZK Infrastructure (ONLINE)";
  }

  let count = 1;
  const status = client.getWalletStatus();
  let walletConnected = status.connected;
  let walletAddress = status.address || '';

  // Sync wallet UI state across pages
  const updateWalletUI = () => {
    if (walletConnected && connectWalletBtn && walletAddress) {
      connectWalletBtn.textContent = `🟢 ${walletAddress.substring(0, 10)}... (Copy)`;
      (connectWalletBtn as HTMLButtonElement).style.background = 'linear-gradient(135deg, #059669, #047857)';
      connectWalletBtn.title = `Connected Address: ${walletAddress}\nClick to copy full address!`;
    } else if (connectWalletBtn) {
      connectWalletBtn.textContent = 'Connect Wallet';
      (connectWalletBtn as HTMLButtonElement).style.background = 'linear-gradient(135deg, #7C3AFF, #6d28d9)';
      connectWalletBtn.title = "Connect Midnight Lace Wallet";
    }
  };

  // 1. Update Wallet UI immediately
  updateWalletUI();

  // 2. Attach Connect Wallet click handler immediately (non-blocking)
  if (connectWalletBtn) {
    connectWalletBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!walletConnected) {
        if (logBoxEl) {
          logBoxEl.innerHTML += `<div class="log-line info">> Requesting connection to browser Midnight Lace Wallet extension...</div>`;
          logBoxEl.scrollTop = logBoxEl.scrollHeight;
        }
        try {
          const res = await client.connectWallet();
          walletConnected = true;
          walletAddress = res.walletAddress;
          updateWalletUI();

          if (logBoxEl) {
            logBoxEl.innerHTML += `<div class="log-line success">> [WALLET CONNECTED] Address: ${res.walletAddress} (${res.walletName})</div>`;
            logBoxEl.innerHTML += `<div class="log-line info">> [FAUCET] Need test tokens? Visit <a href="https://faucet.preprod.midnight.network" target="_blank" style="color:#22d3ee; text-decoration:underline;">Midnight Preprod Faucet</a></div>`;
            logBoxEl.scrollTop = logBoxEl.scrollHeight;
          }
        } catch (err: any) {
          walletConnected = false;
          walletAddress = '';
          updateWalletUI();

          const errorMsg = err?.message || "Failed to connect to Midnight Lace Wallet extension.";
          alert(`Wallet Connection Error:\n\n${errorMsg}`);

          if (logBoxEl) {
            logBoxEl.innerHTML += `<div class="log-line error">> [ERROR] ${errorMsg}</div>`;
            logBoxEl.scrollTop = logBoxEl.scrollHeight;
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(walletAddress);
          alert(`📋 Wallet Address Copied!\n\n${walletAddress}\n\nPaste this into the Midnight Preprod Faucet to receive test tokens.`);
          if (logBoxEl) {
            logBoxEl.innerHTML += `<div class="log-line success">> [COPIED] Wallet address copied: ${walletAddress}</div>`;
            logBoxEl.scrollTop = logBoxEl.scrollHeight;
          }
        } catch (e) {
          alert(`Your Full Wallet Address:\n\n${walletAddress}`);
        }
      }
    };
  }

  // 3. Asynchronously fetch public ledger state from indexer (non-blocking)
  client.fetchPublicState().then((publicState) => {
    if (publicState.submissionCount > 0) {
      count = publicState.submissionCount;
      if (submissionCountEl) submissionCountEl.textContent = count.toString();
      if (heroSubmissionCountEl) heroSubmissionCountEl.textContent = count.toString();
    }
    if (publicState.lastSubmissionCommitment && lastCommitmentEl) {
      lastCommitmentEl.textContent = publicState.lastSubmissionCommitment;
    }
  }).catch((e) => {
    console.warn("Could not query initial public state:", e);
  });

  // Handle Student submitExam() Circuit Submission
  if (formEl) {
    formEl.onsubmit = async (e) => {
      e.preventDefault();

      const examId = examInput ? examInput.value : 'exam_cs101_final_2026';
      const studentKey = studentKeyInput ? studentKeyInput.value : '';
      const answerText = answerContentInput ? answerContentInput.value : '';

      if (!studentKey || studentKey.trim().length === 0) {
        alert("Please enter a private Student Key to generate the ZK witness!");
        return;
      }

      if (progressBar && progressFill) {
        progressBar.style.display = 'block';
        progressFill.style.width = '15%';
      }

      if (logBoxEl) {
        logBoxEl.innerHTML += `<div class="log-line info">> [STEP 1/4] Constructing private witnesses: studentSecretKey(), submissionNonce(), answerHash()...</div>`;
        logBoxEl.innerHTML += `<div class="log-line info">> [STEP 2/4] Executing Compact ZK circuit submitExam() on Midnight Network...</div>`;
        logBoxEl.scrollTop = logBoxEl.scrollHeight;
      }

      client.setStudentSecretKey(studentKey);
      client.setExamAnswers(answerText || "default_exam_answer_hash");

      try {
        if (progressFill) progressFill.style.width = '65%';

        // Real Midnight Smart Contract Circuit Call
        const result = await client.submitExam(examId);

        walletConnected = true;
        walletAddress = result.signedBy || walletAddress;
        updateWalletUI();

        if (progressFill) progressFill.style.width = '100%';

        count++;
        if (submissionCountEl) submissionCountEl.textContent = count.toString();
        if (heroSubmissionCountEl) heroSubmissionCountEl.textContent = count.toString();
        if (lastCommitmentEl) lastCommitmentEl.textContent = result.commitmentHex || '0x...';

        if (logBoxEl) {
          const feeStatusNote = result.walletFunded
            ? `(Deducted from Lace Wallet Balance)`
            : `(Note: Wallet unfunded — get test tokens at <a href="https://faucet.preprod.midnight.network" target="_blank" style="color:#22d3ee; text-decoration:underline;">Midnight Faucet</a>)`;

          const blockInfo = result.blockHeight ? ` | Block #${result.blockHeight}` : '';

          logBoxEl.innerHTML += `<div class="log-line info">> [STEP 3/4] Signed by Lace Wallet: ${result.signedBy} | Fee: ${result.txFee} ${result.txFeeAsset} ${feeStatusNote}</div>`;
          logBoxEl.innerHTML += `<div class="log-line success">> [STEP 4/4] ✓ Compact submitExam() Executed! On-Chain Commitment: ${result.commitmentHex} | TxHash: ${result.txHash}${blockInfo}</div>`;
          logBoxEl.scrollTop = logBoxEl.scrollHeight;
        }

        setTimeout(() => {
          if (progressBar) progressBar.style.display = 'none';
          if (progressFill) progressFill.style.width = '0%';
        }, 800);

      } catch (err: any) {
        if (progressBar) progressBar.style.display = 'none';
        alert(`Exam Submission Circuit Error: ${err?.message}`);
        if (logBoxEl) {
          logBoxEl.innerHTML += `<div class="log-line error">> [ERROR] ${err?.message}</div>`;
          logBoxEl.scrollTop = logBoxEl.scrollHeight;
        }
      }
    };
  }

  // Handle Evaluator resetExam() Circuit Call
  if (updateExamBtn) {
    updateExamBtn.onclick = async (e) => {
      e.preventDefault();
      const newExamVal = newExamInput ? newExamInput.value : '';

      if (!newExamVal || newExamVal.trim().length === 0) {
        alert("Please enter a valid Exam ID string.");
        return;
      }

      try {
        if (adminNotice) {
          adminNotice.style.display = 'block';
          adminNotice.textContent = '⏳ Executing resetExam() circuit on Midnight smart contract...';
        }

        // Real Midnight Smart Contract Circuit Call
        const res = await client.resetExam(newExamVal);

        if (adminNotice) {
          adminNotice.textContent = `✓ resetExam() executed! TxHash: ${res.txHash}`;
          adminNotice.style.display = 'block';
        }

        if (adminLogArea && adminLogBox) {
          adminLogArea.style.display = 'block';
          adminLogBox.innerHTML = `
            <strong>Circuit:</strong> resetExam(newExamId: Bytes&lt;32&gt;)<br>
            <strong>New On-Chain Exam ID:</strong> ${res.newExamId}<br>
            <strong>On-Chain TxHash:</strong> ${res.txHash}<br>
            <strong>Signed By:</strong> ${res.signedBy}<br>
            <strong>Status:</strong> CONFIRMED (Midnight Preprod)
          `;
        }
      } catch (err: any) {
        if (adminNotice) {
          adminNotice.style.display = 'block';
          adminNotice.textContent = `❌ resetExam Error: ${err?.message || err}`;
        }
        alert(`resetExam Circuit Call Failed:\n\n${err?.message || err}`);
      }
    };
  }

  // Handle Evaluator incrementSession() Circuit Call
  if (incrementSessionBtn) {
    incrementSessionBtn.onclick = async (e) => {
      e.preventDefault();
      try {
        if (adminNotice) {
          adminNotice.style.display = 'block';
          adminNotice.textContent = '⏳ Executing incrementSession() circuit on Midnight smart contract...';
        }

        // Real Midnight Smart Contract Circuit Call
        const res = await client.incrementSession();

        if (adminNotice) {
          adminNotice.textContent = `✓ incrementSession() executed! TxHash: ${res.txHash}`;
          adminNotice.style.display = 'block';
        }

        if (adminLogArea && adminLogBox) {
          adminLogArea.style.display = 'block';
          adminLogBox.innerHTML = `
            <strong>Circuit:</strong> incrementSession(): []<br>
            <strong>Action:</strong> Active Exam Session Epoch Incremented (+1)<br>
            <strong>On-Chain TxHash:</strong> ${res.txHash}<br>
            <strong>Signed By:</strong> ${res.signedBy}<br>
            <strong>Status:</strong> CONFIRMED (Midnight Preprod)
          `;
        }
      } catch (err: any) {
        if (adminNotice) {
          adminNotice.style.display = 'block';
          adminNotice.textContent = `❌ incrementSession Error: ${err?.message || err}`;
        }
        alert(`incrementSession Circuit Call Failed:\n\n${err?.message || err}`);
      }
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
