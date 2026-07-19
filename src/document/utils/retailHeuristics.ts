import type { RetailSignal } from '../types'

const rules: Array<[RetailSignal, RegExp]> = [
  ['scenario', /khách hàng|customer|tình huống|scenario/i], ['faq', /\bfaq\b|câu hỏi thường gặp|hỏi đáp/i], ['warning', /lưu ý|cảnh báo|warning|chú ý/i], ['campaign_rule', /không áp dụng|điều kiện áp dụng|đối tượng áp dụng/i], ['campaign', /chiến dịch|campaign|chương trình/i], ['promotion', /khuyến mãi|ưu đãi|promotion|discount/i], ['price', /giá|ngân sách|price|vnđ|vnd/i], ['specification', /thông số|cấu hình|specification|ram|dung lượng|chip/i], ['trainer_note', /trainer note|ghi chú trainer|dành cho trainer/i], ['product', /sản phẩm|product|macbook|iphone|ipad|apple watch|garmin|dji/i],
]
export function detectRetailSignals(value: string): RetailSignal[] { return rules.filter(([, expression]) => expression.test(value)).map(([signal]) => signal) }
