'use client';

interface ExcelData {
  metadata: {
    semester: string;
    programme: string;
    course: string;
    section: string;
  };
  students: Array<{
    usn: string;
    total_marks: string;
    questions: {
      [key: string]: {
        [key: string]: string;
      };
    };
  }>;
}
 
interface ExcelPreviewProps {
  data: ExcelData;
}

export default function ExcelPreview({ data }: ExcelPreviewProps) {
  if (!data || !data.students || data.students.length === 0) {
    return <div className="p-4 border rounded bg-gray-50">No data available</div>;
  }
  
  // Generate column headers for the questions
  const questionHeaders: string[] = [];
  for (let q = 1; q <= 10; q++) {
    for (let sub of 'abcde') {
      questionHeaders.push(`Q${q}${sub}`);
    }
  }
  
  // Calculate totals and averages
  const totalsByQuestion: { [key: string]: number } = {};
  questionHeaders.forEach(header => {
    totalsByQuestion[header] = 0;
  });
  
  let grandTotal = 0;
  
  data.students.forEach(student => {
    questionHeaders.forEach(header => {
      const qNum = header.substring(1, header.length - 1);
      const subQ = header.charAt(header.length - 1).toLowerCase();
      const mark = student.questions[`q${qNum}`]?.[subQ] || '';
      
      if (mark && !isNaN(Number(mark))) {
        totalsByQuestion[header] += Number(mark);
      }
    });
    
    if (student.total_marks && !isNaN(Number(student.total_marks))) {
      grandTotal += Number(student.total_marks);
    }
  });
  
  const averageTotal = data.students.length > 0 ? 
    (grandTotal / data.students.length).toFixed(2) : "0";
  
  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              USN
            </th>
            {questionHeaders.map((header) => (
              <th 
                key={header}
                scope="col" 
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.students.map((student, idx) => (
            <tr key={student.usn || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {student.usn}
              </td>
              
              {/* Render marks for each question */}
              {questionHeaders.map((header) => {
                const qNum = header.substring(1, header.length - 1);
                const subQ = header.charAt(header.length - 1).toLowerCase();
                const mark = student.questions[`q${qNum}`]?.[subQ] || '';
                
                return (
                  <td key={header} className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {mark}
                  </td>
                );
              })}
              
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {student.total_marks}
              </td>
            </tr>
          ))}
          
          {/* Summary row with totals */}
          <tr className="bg-gray-100">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Average
            </td>
            
            {questionHeaders.map((header) => {
              const avg = data.students.length > 0 ? 
                (totalsByQuestion[header] / data.students.length).toFixed(1) : "0";
              
              return (
                <td key={`avg-${header}`} className="px-2 py-4 whitespace-nowrap text-sm text-gray-700 text-center font-medium">
                  {avg}
                </td>
              );
            })}
            
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {averageTotal}
            </td>
          </tr>
          
        </tbody>
      </table>
      
      {/* Metadata display */}
      <div className="p-4 bg-gray-50 border-t">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Exam Details:</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div>Semester: {data.metadata.semester}</div>
          <div>Programme: {data.metadata.programme}</div>
          <div>Course: {data.metadata.course}</div>
          <div>Section: {data.metadata.section}</div>
        </div>
      </div>
    </div>
  );
}