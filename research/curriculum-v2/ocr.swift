import Foundation
import AppKit
import PDFKit
import Vision

let args = CommandLine.arguments
guard args.count >= 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else { fatalError("usage: ocr input.pdf output.txt [first last]") }
let first = args.count > 3 ? Int(args[3])! : 1
let last = args.count > 4 ? min(Int(args[4])!, doc.pageCount) : doc.pageCount
FileManager.default.createFile(atPath: args[2], contents: nil)
let file = FileHandle(forWritingAtPath: args[2])!
for n in first...last {
    autoreleasepool {
        guard let page = doc.page(at: n-1) else { return }
        let box = page.bounds(for: .mediaBox)
        let thumb = page.thumbnail(of: NSSize(width: 1550, height: 1550 * box.height / box.width), for: .mediaBox)
        var rect = CGRect(origin: .zero, size: thumb.size)
        guard let cg = thumb.cgImage(forProposedRect: &rect, context: nil, hints: nil) else { return }
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["zh-Hans", "en-US"]
        request.usesLanguageCorrection = false
        request.usesCPUOnly = true
        do {
            try VNImageRequestHandler(cgImage: cg, options: [:]).perform([request])
            let lines = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
            file.write(("\n=== PDF PAGE \(n) ===\n" + lines + "\n").data(using: .utf8)!)
        } catch { file.write("\n=== PDF PAGE \(n) ERROR \(error) ===\n".data(using: .utf8)!) }
    }
}
try file.close()
print("OCR saved \(last-first+1) pages: \(args[2])")
