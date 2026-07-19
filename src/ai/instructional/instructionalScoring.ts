import type { InstructionalGraph, SalesRelevanceSummary } from './instructionalGraph'

export function calculateSalesRelevance(graph: Pick<InstructionalGraph, 'contentMap' | 'instructionalUnits'>): SalesRelevanceSummary {
  const types = new Set(graph.contentMap.map((item) => item.type)); const formats = new Set(graph.instructionalUnits.map((item) => item.recommendedFormat))
  const rules = [
    ['product', 'Product knowledge coverage', types.has('Product Knowledge') || types.has('Product Specification'), 'Có nội dung kiến thức hoặc thông số sản phẩm.'], ['need', 'Customer need coverage', types.has('Customer Need'), 'Có nội dung xác định nhu cầu khách hàng.'], ['benefit', 'Benefit articulation', types.has('Customer Benefit') || types.has('Key Selling Point'), 'Có liên kết giá trị/lợi ích khách hàng.'], ['objection', 'Objection handling', types.has('Sales Objection'), 'Có ít nhất một phản đối bán hàng.'], ['scenario', 'Consultation scenario', types.has('Consultation Scenario') || formats.has('scenario'), 'Có scenario hoặc format tình huống.'], ['store', 'Apply-at-store coverage', types.has('Apply at Store') || formats.has('store_practice'), 'Có đề xuất áp dụng tại cửa hàng.'], ['compliance', 'Campaign compliance', types.has('Campaign Condition') || types.has('Policy'), 'Có điều kiện chiến dịch hoặc policy.'],
  ] as const
  const metrics = rules.map(([id, label, passed, reason]) => ({ id, label, passed, reason: passed ? reason : `Thiếu: ${reason.toLocaleLowerCase('vi')}` }))
  return { metrics, missingSalesElements: metrics.filter((item) => !item.passed).map((item) => item.label) }
}
