<template>
  <div class="min-h-screen bg-gradient p-6">
    <div class="container">
      <div class="bar">
        <div><h1 class="title"><span class="icon">🏢</span>Building Management</h1><p class="sub">Manage your properties and qualification requirements</p></div>
        <button class="btn primary" @click="showForm = true"><span class="icon">＋</span> Add Building</button>
      </div>

      <div v-if="showForm" class="card">
        <div class="card-head"><h2 class="card-title">{{ editingBuilding ? 'Edit Building' : 'Add New Building' }}</h2><button class="btn ghost icon-only" @click="resetForm">✕</button></div>
        <form class="vstack gap" @submit.prevent="onSubmit">
          <div class="section"><h3 class="section-title">Basic Information</h3>
            <div class="grid2 gap">
              <label class="fld"><span>Building Name *</span><input v-model="form.name" required /></label>
              <label class="fld"><span>Building Type *</span>
                <select v-model="form.building_type"><option>Apartment</option><option>Condo</option><option>Townhouse</option><option>Single Family</option><option>Multi Family</option><option>Other</option></select>
              </label>
              <label class="fld grid-full"><span>Address *</span><input v-model="form.address" required /></label>
              <label class="fld"><span>City *</span><input v-model="form.city" required /></label>
              <label class="fld"><span>State</span><input v-model="form.state" /></label>
              <label class="fld"><span>ZIP Code</span><input v-model="form.zip_code" /></label>
              <label class="fld"><span>Unit Count</span><input type="number" v-model.number="form.unit_count" /></label>
            </div>
          </div>

          <div class="section"><h3 class="section-title">Pre-Qualification Requirements</h3>
            <div class="grid2 gap">
              <label class="fld"><span>Minimum Credit Score (300–900)</span><input type="number" min="300" max="900" placeholder="Leave empty for no requirement" v-model.number="form.minCreditScore" /></label>
              <label class="fld"><span>Income Type</span><select v-model="form.incomeType"><option value="annual">Annual Income</option><option value="monthly">Monthly Income</option></select></label>
              <label v-if="form.incomeType==='annual'" class="fld"><span>Minimum Annual Income</span><input type="number" placeholder="Leave empty for no requirement" v-model.number="form.minAnnualIncome" /></label>
              <label v-else class="fld"><span>Minimum Monthly Income</span><input type="number" placeholder="Leave empty for no requirement" v-model.number="form.minMonthlyIncome" /></label>
              <label class="fld"><span>Max Occupancy per Unit</span><input type="number" placeholder="e.g., 4" v-model.number="form.maxOccupancyPerUnit" /></label>
              <label class="fld"><span>Minimum Lease Term</span><select v-model.number="form.minLeaseTerm"><option :value="6">6 months</option><option :value="12">12 months</option><option :value="18">18 months</option><option :value="24">24 months</option></select></label>
              <label class="fld"><span>Allow Co-signer</span><select v-model="form.allowCosigner"><option :value="true">Yes</option><option :value="false">No</option></select></label>
            </div>
            <div class="mt"><span class="label">Accepted Guarantor Services</span>
              <div class="grid3 gap-sm"><label v-for="s in guarantors" :key="s" class="check"><input type="checkbox" :value="s" v-model="form.acceptGuarantorServices" /><span>{{ s }}</span></label></div>
            </div>
            <div class="mt"><span class="label">Required Background Checks</span>
              <div class="grid3 gap-sm"><label v-for="c in checks" :key="c" class="check"><input type="checkbox" :value="c" v-model="form.requiredBackgroundChecks" /><span>{{ c }}</span></label></div>
            </div>
            <div class="mt"><label class="fld grid-full"><span>Other Requirements</span><textarea rows="3" v-model="form.otherRequirements" /></label></div>
          </div>

          <div class="section"><h3 class="section-title">Proof Documents</h3>
            <div class="vstack gap-sm"><label class="fld"><span>Upload Documents (PDF, Images)</span><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" @change="onFileChange" :disabled="uploadingDocs" /></label>
              <p v-if="uploadingDocs" class="muted">Uploading…</p>
              <div v-if="form.proof_documents?.length" class="chips"><span v-for="(url,i) in form.proof_documents" :key="i" class="chip">Document {{ i + 1 }}<button type="button" class="chip-x" @click="removeDoc(i)">✕</button></span></div>
            </div>
          </div>

          <div class="section"><label class="fld grid-full"><span>Private Notes</span><textarea rows="3" v-model="form.owner_notes" /></label></div>
          <div class="right gap"><button type="button" class="btn" @click="resetForm">Cancel</button><button type="submit" class="btn primary" :disabled="saving"><span class="icon">💾</span> {{ editingBuilding ? 'Update' : 'Create' }} Building</button></div>
        </form>
      </div>

      <div class="grid2 gap" v-if="!loading">
        <div v-for="b in buildings" :key="b.id" class="card hover">
          <div class="card-head between">
            <div class="grow">
              <div class="row gap-sm"><h3 class="card-title">{{ b.name }}</h3><span class="badge" :class="badgeClass(b.verification_status)">{{ badgeText(b.verification_status) }}</span></div>
              <p class="muted">{{ b.address }}</p><p class="muted">{{ b.city }}<template v-if="b.state">, {{ b.state }}</template> {{ b.zip_code }}</p>
              <div class="row gap-sm mt"><span class="pill">{{ b.building_type }}</span><span v-if="b.unit_count" class="pill">{{ b.unit_count }} units</span></div>
            </div>
            <div class="row"><button class="btn ghost icon-only" @click="startEdit(b)">✎</button><button class="btn ghost icon-only danger" @click="confirmDelete(b.id)">🗑</button></div>
          </div>
          <div class="card-body">
            <details class="details"><summary>Pre-Qualification Requirements</summary>
              <div class="kv">
                <div v-if="b.minCreditScore"><span>Min Credit Score:</span><b>{{ b.minCreditScore }}</b></div>
                <div v-if="b.minAnnualIncome || b.minMonthlyIncome"><span>Min Income:</span><b>{{ b.incomeType==='annual' ? `$${(b.minAnnualIncome||0).toLocaleString()}/year` : `$${(b.minMonthlyIncome||0).toLocaleString()}/month` }}</b></div>
                <div v-if="b.maxOccupancyPerUnit"><span>Max Occupancy:</span><b>{{ b.maxOccupancyPerUnit }} per unit</b></div>
                <div v-if="b.minLeaseTerm"><span>Min Lease:</span><b>{{ b.minLeaseTerm }} months</b></div>
                <div><span>Co-signer:</span><b>{{ b.allowCosigner ? 'Allowed' : 'Not Allowed' }}</b></div>
                <div v-if="b.acceptGuarantorServices?.length" class="stack"><span>Guarantor Services:</span><div class="row wrap gap-sm"><span v-for="(s,i) in b.acceptGuarantorServices" :key="i" class="pill xs">{{ s }}</span></div></div>
                <div v-if="b.requiredBackgroundChecks?.length" class="stack"><span>Background Checks:</span><div class="row wrap gap-sm"><span v-for="(c,i) in b.requiredBackgroundChecks" :key="i" class="pill xs">{{ c }}</span></div></div>
                <div v-if="b.otherRequirements" class="stack"><span>Other Requirements:</span><p>{{ b.otherRequirements }}</p></div>
              </div>
            </details>
            <details v-if="b.proof_documents?.length" class="details"><summary>Documents ({{ b.proof_documents.length }})</summary><div class="row wrap gap-sm mt"><a v-for="(url,i) in b.proof_documents" :key="i" :href="url" target="_blank" class="link">Document {{ i+1 }}</a></div></details>
            <details v-if="b.owner_notes" class="details"><summary>Private Notes</summary><p class="mt">{{ b.owner_notes }}</p></details>
            <div v-if="b.verification_status==='rejected' && b.rejection_reason" class="alert"><strong>Rejection Reason:</strong> {{ b.rejection_reason }}</div>
          </div>
        </div>
      </div>

      <div v-if="!loading && buildings.length===0 && !showForm" class="empty">
        <div class="card soft"><div class="empty-icon">🏢</div><h3>No Buildings Yet</h3><p class="muted">Get started by adding your first building and setting up qualification requirements.</p>
          <button class="btn primary" @click="showForm = true"><span class="icon">＋</span> Add Your First Building</button>
        </div>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>
<script setup>
import { reactive, ref, onMounted } from 'vue'
import { listBuildings, createBuilding, updateBuilding, deleteBuilding, uploadFile } from '@/api/buildings'
const loading = ref(true), saving = ref(false), error = ref(''); const buildings = ref([])
const showForm = ref(false), editingBuilding = ref(null)
const guarantors = ['Insurent','Rhino','Leap','TheGuarantors','Other']
const checks = ['Criminal','Eviction','Employment','Credit','Rental History']
const blank = () => ({ name:'',address:'',city:'',state:'',zip_code:'',unit_count:'',building_type:'Apartment',minCreditScore:'',minAnnualIncome:'',minMonthlyIncome:'',incomeType:'annual',allowCosigner:true,acceptGuarantorServices:[],requiredBackgroundChecks:[],maxOccupancyPerUnit:'',minLeaseTerm:12,otherRequirements:'',verification_status:'pending',rejection_reason:'',proof_documents:[],owner_notes:'' })
const form = reactive(blank())
function resetForm(){ Object.assign(form, blank()); editingBuilding.value=null; showForm.value=false }
async function fetchList(){ loading.value=true; error.value=''; try{ buildings.value = await listBuildings() }catch(e){ error.value = e?.response?.data?.message || e.message || 'Load failed' } finally{ loading.value=false } }
function startEdit(b){ editingBuilding.value=b; Object.assign(form, blank(), { ...b }) ; showForm.value=true }
async function onSubmit(){ error.value=''; saving.value=true; const payload={ ...form, unit_count: form.unit_count===''?null:Number(form.unit_count), minCreditScore: form.minCreditScore===''?null:Number(form.minCreditScore), minAnnualIncome: form.minAnnualIncome===''?null:Number(form.minAnnualIncome), minMonthlyIncome: form.minMonthlyIncome===''?null:Number(form.minMonthlyIncome), maxOccupancyPerUnit: form.maxOccupancyPerUnit===''?null:Number(form.maxOccupancyPerUnit), minLeaseTerm: Number(form.minLeaseTerm), verification_status: editingBuilding.value?.verification_status || 'pending', rejection_reason: form.rejection_reason || '' }
  try{ if(editingBuilding.value){ await updateBuilding(editingBuilding.value.id, payload) } else { await createBuilding(payload) } await fetchList(); resetForm() }catch(e){ error.value = e?.response?.data?.message || e.message || 'Save failed' } finally{ saving.value=false } }
async function confirmDelete(id){ if(!confirm('Are you sure you want to delete this building?')) return; error.value=''; try{ await deleteBuilding(id); await fetchList() }catch(e){ error.value = e?.response?.data?.message || e.message || 'Delete failed' } }
const uploadingDocs = ref(false)
async function onFileChange(e){ const files = Array.from(e.target.files||[]); if(files.length===0) return; uploadingDocs.value=true; try{ const urls=[]; for(const f of files){ const { file_url } = await uploadFile(f); urls.push(file_url) } form.proof_documents=[...(form.proof_documents||[]), ...urls] }catch(e2){ error.value='Error uploading files. Please try again.' } finally{ uploadingDocs.value=false; e.target.value='' } }
function removeDoc(i){ form.proof_documents = form.proof_documents.filter((_,idx)=>idx!==i) }
function badgeText(s){ return s==='verified'?'Verified':(s==='rejected'?'Rejected':'Pending') } function badgeClass(s){ return s==='verified'?'ok':(s==='rejected'?'bad':'warn') }
onMounted(fetchList)
</script>
<style scoped>
.bg-gradient{background:linear-gradient(135deg,#eff6ff,#faf5ff,#fff1f2)} .container{max-width:1120px;margin:0 auto}
.bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.title{font-size:28px;font-weight:800;display:flex;align-items:center;gap:8px}.sub{color:#64748b;margin-top:6px}.icon{margin-right:6px}
.btn{border:1px solid #e5e7eb;border-radius:10px;padding:8px 14px;background:#fff;cursor:pointer}.btn.primary{background:linear-gradient(90deg,#2563eb,#7c3aed);color:#fff;border:none}.btn.ghost{background:transparent}.btn.icon-only{padding:6px 8px}.btn.danger{color:#dc2626}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px;margin-bottom:16px;box-shadow:0 2px 6px rgba(0,0,0,.04)} .card.soft{padding:32px} .card.hover:hover{box-shadow:0 6px 16px rgba(0,0,0,.08)}
.card-head{display:flex;align-items:center;gap:12px}.card-head.between{justify-content:space-between}.card-title{font-size:18px;font-weight:700}.card-body{padding:8px 2px}
.section{border-top:1px solid #e5e7eb;padding-top:16px;margin-top:8px}.section-title{font-weight:700;margin-bottom:12px}
.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.grid-full{grid-column:1 / -1}.gap{gap:14px}.gap-sm{gap:8px}
.vstack{display:flex;flex-direction:column}.row{display:flex;align-items:center}.wrap{flex-wrap:wrap}.right{display:flex;justify-content:flex-end}.mt{margin-top:12px}.muted{font-size:13px;color:#6b7280}
.fld{display:flex;flex-direction:column;gap:6px}.fld input,.fld select,.fld textarea{border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px}
.badge{border-radius:9999px;padding:3px 8px;font-size:12px}.badge.ok{background:#dcfce7;color:#166534}.badge.warn{background:#fef9c3;color:#854d0e}.badge.bad{background:#fee2e2;color:#991b1b}
.pill{border:1px solid #e5e7eb;border-radius:9999px;padding:2px 8px;font-size:12px}.pill.xs{font-size:11px;padding:1px 6px}
.details{margin-top:8px}.kv{display:grid;grid-template-columns:1fr auto;gap:6px 12px;margin-top:8px}.kv>div{display:contents}.link{color:#2563eb;text-decoration:underline}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chip{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:9999px;padding:4px 8px;display:inline-flex;align-items:center;gap:6px}.chip-x{border:none;background:transparent;cursor:pointer;color:#ef4444}
.empty{text-align:center;padding:40px 0}.empty-icon{font-size:48px;margin-bottom:8px}.error{color:#b91c1c;margin-top:10px}
@media (max-width: 760px){ .grid2{grid-template-columns:1fr} .grid3{grid-template-columns:repeat(2,1fr)} }
</style>
