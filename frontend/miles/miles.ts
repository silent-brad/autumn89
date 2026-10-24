function incrementMiles(): void {
  const input = document.getElementById("miles")! as HTMLInputElement;
  const currentValue = parseFloat(input.value) || 0;
  input.value = (currentValue + 0.5).toFixed(1);
}

function decrementMiles(): void {
  const input = document.getElementById("miles")! as HTMLInputElement;
  const currentValue = parseFloat(input.value) || 0;
  if (currentValue > 0.1) {
    input.value = (currentValue - 0.5).toFixed(1);
  }
}

function editMiles(entryId: string, currentMiles: number): void {
  const row = document.getElementById(
    "entry-row-" + entryId
  )! as HTMLTableRowElement;
  const cells = row.querySelectorAll("td")! as NodeListOf<HTMLTableCellElement>;
  cells[1].innerHTML = `<input type="number" id="edit-miles-${entryId}" value="${currentMiles}" step="0.1" min="0.1" max="50" class="numbers edit-miles-input">`;
  cells[2].innerHTML = `
		<div class="edit-form">
			<button class="secondary outline save-btn" onclick="submitEditMiles(${entryId})">Save</button>
			<button class="secondary outline delete-btn-inline" onclick="deleteMiles(${entryId})">Delete</button>
			<button class="secondary outline cancel-btn-inline" onclick="cancelEdit(${entryId}, ${currentMiles})">Cancel</button>
		</div>`;
}

function cancelEdit(entryId: string, currentMiles: number): void {
  const row = document.getElementById(
    "entry-row-" + entryId
  )! as HTMLTableRowElement;
  const cells = row.querySelectorAll("td")! as NodeListOf<HTMLTableCellElement>;
  cells[1].innerHTML = `<span class="miles-display-${entryId}">${currentMiles}</span>`;
  cells[2].innerHTML = `<button class="secondary outline edit-btn" onclick="editMiles(${entryId}, ${currentMiles})">Edit</button>`;
}

function submitEditMiles(entryId: string): void {
  const miles = document.getElementById(
    "edit-miles-" + entryId
  )! as HTMLInputElement;
  fetch("/edit-miles", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `entry_id=${entryId}&miles=${miles}`,
  })
    .then((r) => r.text())
    .then((html) => {
      const editResponse = document.getElementById("edit-response");
      if (!editResponse) return;
      editResponse.innerHTML = html;
      setTimeout(() => window.location.reload(), 1000);
    });
}

function deleteMiles(entryId: string): void {
  if (!confirm("Delete this entry?")) return;
  fetch("/delete-miles", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `entry_id=${entryId}`,
  })
    .then((r) => r.text())
    .then((html) => {
      const editResponse = document.getElementById("edit-response")!;
      editResponse.innerHTML = html;
      setTimeout(() => window.location.reload(), 1000);
    });
}
