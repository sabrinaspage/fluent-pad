/*
 * Copyright 2020 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

use crate::Result;

pub fn u64_to_usize(value: u64) -> Result<usize> {
    use crate::errors::HistoryError::InvalidArgument;
    use std::convert::TryFrom;

    usize::try_from(value)
        .map_err(|_| InvalidArgument(format!("limit should be less than {}", i64::max_value())))
}

pub(super) fn usize_to_u64(value: usize) -> Result<u64> {
    use crate::errors::HistoryError::InvalidArgument;
    use std::convert::TryFrom;

    u64::try_from(value)
        .map_err(|_| InvalidArgument(format!("limit should be less than {}", i64::max_value())))
}
